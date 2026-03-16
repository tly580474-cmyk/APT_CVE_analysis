const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

// 初始化管理员账号
const initAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@apt-analysis.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('管理员账号已创建: admin / admin123');
    }
  } catch (error) {
    console.error('初始化管理员账号错误:', error);
  }
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user', // 默认普通用户
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar;
    await user.save();

    res.json({
      message: '更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// ========== 管理员功能 ==========

// 获取所有用户（管理员）
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'avatar', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除用户（管理员）
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: '不能删除自己的账号' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 不能删除其他管理员
    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能删除管理员账号' });
    }

    await user.destroy();
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 修改用户角色（管理员）
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: '无效的角色' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 不能修改自己的角色
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }

    user.role = role;
    await user.save();

    res.json({ message: '角色更新成功', user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  initAdminUser,
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
  updateUserRole,
};
