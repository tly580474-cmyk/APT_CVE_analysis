const fs = require('fs').promises;
const path = require('path');

// 获取CVE分析报告数据
const getCVEAnalysisReport = async (req, res) => {
  try {
    const reportPath = path.join(__dirname, '../../../cve_analysis_report.txt');
    const content = await fs.readFile(reportPath, 'utf-8');
    
    res.json({
      message: '获取CVE分析报告成功',
      content: content
    });
  } catch (error) {
    console.error('读取CVE分析报告错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 提取漏洞类型的简短名称（括号内的内容）
const extractShortVulnName = (type) => {
  if (type === 'n%2Fa' || type === 'n/a') {
    return '其他';
  }
  
  // 尝试匹配括号内的内容
  const bracketMatch = type.match(/\(([^)]+)\)/);
  if (bracketMatch) {
    return bracketMatch[1];
  }
  
  // 如果没有括号，提取CWE编号后的简短描述
  const cweMatch = type.match(/CWE-\d+\s+(.+)/);
  if (cweMatch) {
    const shortDesc = cweMatch[1];
    // 如果描述太长，只取前20个字符
    if (shortDesc.length > 20) {
      return shortDesc.substring(0, 20) + '...';
    }
    return shortDesc;
  }
  
  // 其他情况，直接返回原始类型（限制长度）
  if (type.length > 25) {
    return type.substring(0, 25) + '...';
  }
  return type;
};

// 解析CVE分析报告数据
const parseCVEAnalysisReport = async (req, res) => {
  try {
    const reportPath = path.join(__dirname, '../../../cve_analysis_report.txt');
    const content = await fs.readFile(reportPath, 'utf-8');
    
    const lines = content.split('\n');
    const data = {
      yearData: {},
      vulnerabilityTypes: {},
      products: {},
      pocAvailable: 0,
      pocUnavailable: 0,
    };

    let section = '';

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed === 'CVE count by year:') {
        section = 'years';
      } else if (trimmed === 'Top 10 vulnerability types:') {
        section = 'vulnerabilities';
      } else if (trimmed === 'Top 10 products:') {
        section = 'products';
      } else if (trimmed === 'POC availability:') {
        section = 'poc';
      } else if (trimmed.startsWith('With GitHub POC:')) {
        data.pocAvailable = parseInt(trimmed.split(':')[1].trim());
      } else if (trimmed.startsWith('Without GitHub POC:')) {
        data.pocUnavailable = parseInt(trimmed.split(':')[1].trim());
      } else if (section === 'years' && trimmed.includes(':')) {
        const [year, count] = trimmed.split(': ');
        data.yearData[year] = parseInt(count);
      } else if (section === 'vulnerabilities' && trimmed.includes(':')) {
        const parts = trimmed.split(': ');
        const type = parts.slice(0, -1).join(': ');
        const count = parseInt(parts[parts.length - 1]);
        const shortName = extractShortVulnName(type);
        // 如果名称已存在，累加数量
        if (data.vulnerabilityTypes[shortName]) {
          data.vulnerabilityTypes[shortName] += count;
        } else {
          data.vulnerabilityTypes[shortName] = count;
        }
      } else if (section === 'products' && trimmed.includes(':')) {
        const parts = trimmed.split(': ');
        const product = parts.slice(0, -1).join(': ');
        const count = parseInt(parts[parts.length - 1]);
        // 解码URL编码的产品名称
        const decodedProduct = decodeURIComponent(product);
        data.products[decodedProduct === 'n/a' ? '其他' : decodedProduct] = count;
      }
    });

    res.json({
      message: '解析CVE分析报告成功',
      data: data
    });
  } catch (error) {
    console.error('解析CVE分析报告错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getCVEAnalysisReport,
  parseCVEAnalysisReport
};
