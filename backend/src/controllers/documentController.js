const { Document, User } = require('../models');
const fs = require('fs').promises;
const path = require('path');

// 获取所有文档
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(documents);
  } catch (error) {
    console.error('获取文档列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个文档
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    res.json(document);
  } catch (error) {
    console.error('获取文档详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建文档
const createDocument = async (req, res) => {
  try {
    // 限制只有管理员能创建文档
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员能创建文档' });
    }

    const { title, content, threatLevel } = req.body;
    const document = await Document.create({
      title,
      content,
      threatLevel,
      authorId: req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      message: '文档创建成功',
      document,
    });
  } catch (error) {
    console.error('创建文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新文档
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, threatLevel } = req.body;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 检查权限
    if (document.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此文档' });
    }

    document.title = title || document.title;
    document.content = content || document.content;
    document.threatLevel = threatLevel || document.threatLevel;
    await document.save();

    res.json({
      message: '文档更新成功',
      document,
    });
  } catch (error) {
    console.error('更新文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除文档
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    // 检查权限
    if (document.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此文档' });
    }

    // 删除关联的文件
    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (err) {
        console.error('删除文件错误:', err);
      }
    }

    await document.destroy();
    res.json({ message: '文档删除成功' });
  } catch (error) {
    console.error('删除文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 上传文档 (供富文本编辑器上传图片等媒体使用)
const uploadDocument = async (req, res) => {
  try {
    // 限制只有管理员能上传文档
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员能上传文档' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '未上传文件' });
    }

    // 返回相对于静态目录的路径
    const fileName = path.basename(req.file.path);
    const relativePath = `uploads/${fileName}`;

    const { title } = req.body;
    const document = await Document.create({
      title: title || req.file.originalname,
      filePath: relativePath,
      fileType: req.file.mimetype,
      authorId: req.user.id,
    });

    res.status(201).json({
      message: '文档上传成功',
      document: {
        ...document.toJSON(),
        url: `http://localhost:3001/${relativePath}`
      },
    });
  } catch (error) {
    console.error('上传文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocument,
};
