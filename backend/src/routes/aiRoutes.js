const express = require('express');
const router = express.Router();
const { analyzeDocument, analyzeDocumentStream } = require('../controllers/aiController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/analyze', authMiddleware, analyzeDocument);
router.post('/analyze-stream', authMiddleware, analyzeDocumentStream);

module.exports = router;
