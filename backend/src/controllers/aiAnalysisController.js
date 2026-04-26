const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const AI_CONFIG = {
  baseURL: process.env.AI_BASE_URL || 'https://yinli.one/v1',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-3-flash-preview',
  defaultPrompt: process.env.AI_DEFAULT_PROMPT || '现在你是一位安全工程师，分析用户上传的cve漏洞文件，输出其主要内容，并给出建议'
};

const analyzeCVEFile = async (req, res) => {
  try {
    const { filePath, customPrompt } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: '请提供文件路径' });
    }

    const fullPath = path.join(__dirname, '../../../', filePath);
    let content;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      return res.status(404).json({ message: '文件不存在或无法读取' });
    }

    const maxLength = 8000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n... (内容已截断)'
      : content;

    const systemPrompt = customPrompt || AI_CONFIG.defaultPrompt;
    const userPrompt = `请分析以下CVE漏洞文件内容：\n\n${truncatedContent}`;

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
    if (error.response) {
      console.error('AI API响应错误:', error.response.data);
    }
    res.status(500).json({
      message: 'AI分析失败',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

const analyzeText = async (req, res) => {
  try {
    const { content, customPrompt } = req.body;

    if (!content) {
      return res.status(400).json({ message: '请提供分析内容' });
    }

    const maxLength = 8000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n... (内容已截断)'
      : content;

    const systemPrompt = customPrompt || AI_CONFIG.defaultPrompt;
    const userPrompt = `请分析以下内容：\n\n${truncatedContent}`;

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

const analyzeTextStream = async (req, res) => {
  try {
    const { content, customPrompt } = req.body;

    if (!content) {
      return res.status(400).json({ message: '请提供分析内容' });
    }

    const maxLength = 8000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n... (内容已截断)'
      : content;

    const systemPrompt = customPrompt || AI_CONFIG.defaultPrompt;
    const userPrompt = `请分析以下内容：\n\n${truncatedContent}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    const response = await axios.post(
      `${AI_CONFIG.baseURL}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 120000
      }
    );

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

    req.on('close', () => {
      response.data.destroy();
    });

  } catch (error) {
    console.error('AI流式分析错误:', error.message);
    res.status(500).json({
      message: 'AI分析失败',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

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
  analyzeTextStream,
  getAIConfig
};