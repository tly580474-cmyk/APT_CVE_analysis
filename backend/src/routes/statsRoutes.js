const express = require('express');
const router = express.Router();
const { getCVEAnalysisReport, parseCVEAnalysisReport } = require('../controllers/statsController');

// 获取CVE分析报告
router.get('/cve-analysis', getCVEAnalysisReport);

// 解析CVE分析报告数据
router.get('/cve-analysis/parsed', parseCVEAnalysisReport);

module.exports = router;
