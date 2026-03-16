const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// AI分析配置
const AI_CONFIG = {
  baseURL: process.env.AI_BASE_URL || 'https://free.v36.cm/v1',
  apiKey: process.env.AI_API_KEY || 'sk-haCw0b52kZKvmycHCb4742Ad27A44011838cEf6c43864b82',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  defaultPrompt: process.env.AI_DEFAULT_PROMPT || '现在你是一位安全工程师，分析用户上传的cve漏洞文件，输出其主要内容，并给出建议'
};

// 分析CVE文件
const analyzeCVEFile = async (req, res) => {
  try {
    const { filePath, customPrompt } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ message: '请提供文件路径' });
    }

    // 读取文件内容
    const fullPath = path.join(__dirname, '../../../', filePath);
    let content;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      return res.status(404).json({ message: '文件不存在或无法读取' });
    }

    // 限制内容长度，避免超出token限制
    const maxLength = 8000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '\n... (内容已截断)' 
      : content;

    // 构建提示词
    const systemPrompt = customPrompt || AI_CONFIG.defaultPrompt;
    const userPrompt = `请分析以下CVE漏洞文件内容：\n\n${truncatedContent}`;

    // 调用AI API
    const response = await axios.post(
      `${AI_CONFIG.baseURL}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60秒超时
      }
    );

    // 解析AI响应
    const analysis = response.data.choices[0]?.message?.content || '分析失败';

    res.json({
      message: '分析完成',
      analysis: analysis,
      model: AI_CONFIG.model,
      usage: response.data.usage
    });
  } catch (error) {
    console.error('AI分析错误:', error.message);
    if (error.response) {
      console.error('AI API响应错误:', error.response.data);
    }
    res.status(500).json({ 
      message: 'AI分析失败',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// 分析文本内容
const analyzeText = async (req, res) => {
  try {
    const { content, customPrompt } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '请提供分析内容' });
    }

    // 限制内容长度
    const maxLength = 8000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '\n... (内容已截断)' 
      : content;

    // 构建提示词
    const systemPrompt = customPrompt || AI_CONFIG.defaultPrompt;
    const userPrompt = `请分析以下内容：\n\n${truncatedContent}`;

    // 调用AI API
    const response = await axios.post(
      `${AI_CONFIG.baseURL}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const analysis = response.data.choices[0]?.message?.content || '分析失败';

    res.json({
      message: '分析完成',
      analysis: analysis,
      model: AI_CONFIG.model,
      usage: response.data.usage
    });
  } catch (error) {
    console.error('AI分析错误:', error.message);
    res.status(500).json({ 
      message: 'AI分析失败',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// 获取AI配置信息
const getAIConfig = async (req, res) => {
  res.json({
    model: AI_CONFIG.model,
    baseURL: AI_CONFIG.baseURL,
    defaultPrompt: AI_CONFIG.defaultPrompt
  });
};

module.exports = {
  analyzeCVEFile,
  analyzeText,
  getAIConfig
};
