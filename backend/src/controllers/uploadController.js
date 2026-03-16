const fs = require('fs').promises;
const path = require('path');

// 上传图片 (供富文本编辑器使用)
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传文件' });
    }

    // 返回相对于静态目录的路径
    const fileName = path.basename(req.file.path);
    const relativePath = `uploads/${fileName}`;

    res.status(201).json({
      message: '图片上传成功',
      url: `http://localhost:3001/${relativePath}`,
      filePath: relativePath
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  uploadImage
};
