const axios = require('axios');
const { Document } = require('../models');

// AI分析文档
const analyzeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;

    // 获取文档
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 更新文档状态为分析中
    document.status = 'analyzing';
    await document.save();

    // 构建prompt
    const prompt = `请分析以下APT攻击情报文档，提取关键信息并以JSON格式返回：

文档标题：${document.title}
文档内容：${document.content || '无文本内容'}

请分析并返回以下信息：
1. 威胁等级（low/medium/high/critical）
2. 攻击类型
3. 主要威胁指标（IoCs）
4. 建议的防护措施
5. 文档摘要

请以JSON格式返回，格式如下：
{
  "threatLevel": "high",
  "attackTypes": ["钓鱼攻击", "恶意软件"],
  "iocs": {
    "ips": [],
    "domains": [],
    "hashes": []
  },
  "recommendations": [],
  "summary": ""
}`;

    // 调用OpenAI API
    const response = await axios.post(
      process.env.OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的网络安全分析专家，擅长分析APT攻击情报文档。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 解析AI响应
    const aiContent = response.data.choices[0].message.content;
    let aiAnalysis;
    
    try {
      // 尝试解析JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        aiAnalysis = {
          summary: aiContent,
          threatLevel: 'medium',
          attackTypes: [],
          iocs: { ips: [], domains: [], hashes: [] },
          recommendations: [],
        };
      }
    } catch (parseError) {
      console.error('解析AI响应错误:', parseError);
      aiAnalysis = {
        summary: aiContent,
        threatLevel: 'medium',
        attackTypes: [],
        iocs: { ips: [], domains: [], hashes: [] },
        recommendations: [],
      };
    }

    // 更新文档
    document.aiAnalysis = aiAnalysis;
    document.threatLevel = aiAnalysis.threatLevel;
    document.status = 'completed';
    await document.save();

    res.json({
      message: '分析完成',
      analysis: aiAnalysis,
    });
  } catch (error) {
    console.error('AI分析错误:', error);
    
    // 更新文档状态为失败
    if (req.body.documentId) {
      const document = await Document.findByPk(req.body.documentId);
      if (document) {
        document.status = 'pending';
        await document.save();
      }
    }

    res.status(500).json({ message: 'AI分析失败', error: error.message });
  }
};

// 流式分析（用于打字机效果）
const analyzeDocumentStream = async (req, res) => {
  try {
    const { documentId } = req.body;

    // 设置SSE头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const document = await Document.findByPk(documentId);
    if (!document) {
      res.write(`data: ${JSON.stringify({ error: '文档不存在' })}\n\n`);
      res.end();
      return;
    }

    // 发送分析阶段更新
    const stages = [
      { stage: 'reading', message: '正在读取文档...' },
      { stage: 'extracting', message: '提取特征码...' },
      { stage: 'analyzing', message: '生成威胁评估...' },
      { stage: 'completed', message: '分析完成' },
    ];

    for (const stage of stages) {
      res.write(`data: ${JSON.stringify(stage)}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('流式分析错误:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

module.exports = {
  analyzeDocument,
  analyzeDocumentStream,
};
