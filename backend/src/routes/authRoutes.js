const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  getAllUsers,
  deleteUser,
  updateUserRole
} = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 需要认证的路由
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

// 管理员路由
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
router.put('/users/:id/role', authMiddleware, adminMiddleware, updateUserRole);

module.exports = router;
