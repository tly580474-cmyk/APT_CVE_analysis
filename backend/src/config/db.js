const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('环境变量:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'apt_analysis',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功。');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
