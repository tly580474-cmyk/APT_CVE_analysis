const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/cve', require('./routes/cveRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/forum', require('./routes/forumRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/ai-analysis', require('./routes/aiAnalysisRoutes'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

module.exports = app;
