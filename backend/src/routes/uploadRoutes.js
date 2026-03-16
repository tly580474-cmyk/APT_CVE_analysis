const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { authMiddleware } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 上传图片 (供富文本编辑器使用)
router.post('/image', authMiddleware, upload.single('file'), uploadImage);

module.exports = router;
