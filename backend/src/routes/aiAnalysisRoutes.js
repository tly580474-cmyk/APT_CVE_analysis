const express = require('express');
const router = express.Router();
const { analyzeCVEFile, analyzeText, analyzeTextStream, getAIConfig } = require('../controllers/aiAnalysisController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/config', authMiddleware, getAIConfig);
router.post('/analyze-file', authMiddleware, analyzeCVEFile);
router.post('/analyze-text', authMiddleware, analyzeText);
router.post('/analyze-text-stream', authMiddleware, analyzeTextStream);

module.exports = router;
