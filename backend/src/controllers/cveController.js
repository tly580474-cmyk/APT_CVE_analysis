const { CVE } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

// 辅助函数：从 cve_repo 获取所有 .md 文件列表
const getCVEFilesFromRepo = async () => {
  try {
    const repoPath = path.join(__dirname, '../../../cve_repo');
    const years = await fs.readdir(repoPath);
    let allFiles = [];

    for (const year of years) {
      const yearPath = path.join(repoPath, year);
      const stats = await fs.stat(yearPath);
      if (stats.isDirectory()) {
        const files = await fs.readdir(yearPath);
        const mdFiles = files
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            id: f.replace('.md', ''),
            year: year,
            path: path.join(year, f)
          }));
        allFiles = allFiles.concat(mdFiles);
      }
    }

    // 按年份和ID降序排列（最新的在前）
    return allFiles.sort((a, b) => {
      if (b.year !== a.year) return b.year.localeCompare(a.year);
      return b.id.localeCompare(a.id);
    });
  } catch (error) {
    console.error('获取CVE文件列表错误:', error);
    return [];
  }
};

// 辅助函数：解析 .md 文件内容获取基本信息
const parseCVEContent = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../../cve_repo', filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // 简单解析标题和描述
    const titleMatch = content.match(/### \[(.*?)\]/);
    const id = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    const descriptionMatch = content.match(/### Description\s+([\s\S]*?)\s+###/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    const severityMatch = content.match(/Vulnerability&message=(.*?)&/);
    const severity = severityMatch ? decodeURIComponent(severityMatch[1]) : 'Unknown';

    return {
      id,
      title: id, // 默认标题为ID
      description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
      severity: severity,
      date: filePath.split(path.sep)[0] // 使用年份作为日期
    };
  } catch (error) {
    console.error('解析CVE文件错误:', filePath, error.message);
    return { id: path.basename(filePath, '.md'), title: 'Unknown', severity: 'Unknown' };
  }
};

// 辅助函数：获取完整CVE详情
const getCVEDetailFromFile = async (cveId) => {
  try {
    // 从CVE ID中提取年份
    const yearMatch = cveId.match(/CVE-(\d{4})-/);
    if (!yearMatch) {
      throw new Error('Invalid CVE ID format');
    }
    const year = yearMatch[1];
    
    const filePath = path.join(__dirname, '../../../cve_repo', year, `${cveId}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 解析完整内容
    const titleMatch = content.match(/### \[(.*?)\]/);
    const id = titleMatch ? titleMatch[1] : cveId;
    
    const descriptionMatch = content.match(/### Description\s+([\s\S]*?)\s+###/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    const severityMatch = content.match(/Vulnerability&message=(.*?)&/);
    const severity = severityMatch ? decodeURIComponent(severityMatch[1]) : 'Unknown';
    
    // 提取参考链接
    const referenceMatch = content.match(/### Reference\s+([\s\S]*?)(?=###|$)/);
    const reference = referenceMatch ? referenceMatch[1].trim() : '';
    
    // 提取Github链接
    const githubMatch = content.match(/Github\s+([\s\S]*?)(?=###|$)/);
    const github = githubMatch ? githubMatch[1].trim() : '';

    return {
      id,
      title: id,
      description,
      severity,
      date: year,
      reference,
      github,
      fullContent: content
    };
  } catch (error) {
    console.error('获取CVE详情错误:', cveId, error.message);
    return null;
  }
};

// 获取所有CVE (带分页和搜索)
const getAllCVEs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let allFiles = await getCVEFilesFromRepo();
    
    // 如果有搜索关键词，进行过滤
    if (search) {
      const searchLower = search.toLowerCase();
      allFiles = allFiles.filter(file => 
        file.id.toLowerCase().includes(searchLower)
      );
    }

    const count = allFiles.length;
    const paginatedFiles = allFiles.slice(offset, offset + limit);

    const cves = await Promise.all(paginatedFiles.map(file => parseCVEContent(file.path)));

    res.json({
      cves,
      total: count,
      page: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取CVE列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个CVE
const getCVEById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先从文件系统读取完整详情
    const cveDetail = await getCVEDetailFromFile(id);
    
    if (cveDetail) {
      return res.json(cveDetail);
    }
    
    // 如果文件不存在，尝试从数据库获取
    const cve = await CVE.findByPk(id);
    if (cve) {
      cve.heat += 1;
      await cve.save();
      return res.json(cve);
    }

    return res.status(404).json({ message: 'CVE不存在' });
  } catch (error) {
    console.error('获取CVE详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 搜索CVE
const searchCVEs = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: '请提供搜索关键词' });
    }

    const allFiles = await getCVEFilesFromRepo();
    const filteredFiles = allFiles.filter(file => 
      file.id.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 20);

    const cves = await Promise.all(filteredFiles.map(file => parseCVEContent(file.path)));

    res.json(cves);
  } catch (error) {
    console.error('搜索CVE错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取热门CVE (首页展示最新的4个)
const getHotCVEs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    const allFiles = await getCVEFilesFromRepo();
    const latestFiles = allFiles.slice(0, limit);

    const cves = await Promise.all(latestFiles.map(file => parseCVEContent(file.path)));

    res.json(cves);
  } catch (error) {
    console.error('获取热门CVE错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取CVE统计
const getCVEStats = async (req, res) => {
  try {
    const allFiles = await getCVEFilesFromRepo();
    
    // 解析所有文件获取统计信息
    const cves = await Promise.all(allFiles.slice(0, 100).map(file => parseCVEContent(file.path)));
    
    const stats = {
      total: allFiles.length,
      bySeverity: {
        Critical: cves.filter(c => c.severity === 'Critical').length,
        High: cves.filter(c => c.severity === 'High').length,
        Medium: cves.filter(c => c.severity === 'Medium').length,
        Low: cves.filter(c => c.severity === 'Low').length,
        Unknown: cves.filter(c => c.severity === 'Unknown').length,
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('获取CVE统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllCVEs,
  getCVEById,
  searchCVEs,
  getHotCVEs,
  getCVEStats,
};
