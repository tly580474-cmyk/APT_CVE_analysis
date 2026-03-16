const express = require('express');
const router = express.Router();
const { analyzeCVEFile, analyzeText, getAIConfig } = require('../controllers/aiAnalysisController');
const { authMiddleware } = require('../middlewares/auth');

// 获取AI配置信息
router.get('/config', authMiddleware, getAIConfig);

// 分析CVE文件
router.post('/analyze-file', authMiddleware, analyzeCVEFile);

// 分析文本内容
router.post('/analyze-text', authMiddleware, analyzeText);

module.exports = router;
