const app = require('./app');
const { sequelize, testConnection } = require('./config/db');
const { initAdminUser } = require('./controllers/authController');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

// 测试数据库连接
const startServer = async () => {
  try {
    await testConnection();
    
    // 同步数据库模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步完成');

    // 初始化管理员账号
    await initAdminUser();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API地址: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
