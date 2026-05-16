const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock models before requiring controller
jest.mock('../../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    role: 'user',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
  };

  return {
    User: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    },
    mockUser,
  };
});

const { User, mockUser } = require('../../src/models');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
  updateUserRole,
} = require('../../src/controllers/authController');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '24h';

    req = {
      body: {},
      params: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        role: 'user',
        avatar: null,
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '注册成功',
          token: expect.any(String),
          user: expect.objectContaining({
            username: 'newuser',
            email: 'new@example.com',
          }),
        })
      );
    });

    it('应该返回400当用户名已存在时', async () => {
      req.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({ id: 1, username: 'existinguser' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '用户名或邮箱已存在' });
    });

    it('应该返回500当服务器出错时', async () => {
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: '服务器错误' });
    });
  });

  describe('login', () => {
    it('应该成功登录并返回token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        avatar: null,
      });

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '登录成功',
          token: expect.any(String),
          user: expect.objectContaining({
            username: 'testuser',
          }),
        })
      );
    });

    it('应该返回401当用户不存在时', async () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '用户名或密码错误' });
    });

    it('应该返回401当密码错误时', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      req.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      User.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '用户名或密码错误' });
    });
  });

  describe('getMe', () => {
    it('应该返回当前用户信息', async () => {
      req.user = { id: 1 };

      User.findByPk.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar: null,
        createdAt: new Date(),
      });

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'testuser',
        })
      );
    });

    it('应该返回404当用户不存在时', async () => {
      req.user = { id: 999 };

      User.findByPk.mockResolvedValue(null);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
    });
  });

  describe('updateProfile', () => {
    it('应该成功更新用户资料', async () => {
      req.user = { id: 1 };
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const mockUserInstance = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar: null,
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      await updateProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '更新成功',
          user: expect.objectContaining({
            username: 'updateduser',
            email: 'updated@example.com',
          }),
        })
      );
    });

    it('应该返回404当用户不存在时', async () => {
      req.user = { id: 999 };
      req.body = { username: 'updated' };

      User.findByPk.mockResolvedValue(null);

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
    });
  });

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      const oldHashedPassword = await bcrypt.hash('oldpassword', 10);
      req.user = { id: 1 };
      req.body = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      const mockUserInstance = {
        id: 1,
        password: oldHashedPassword,
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      await changePassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: '密码修改成功' });
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it('应该返回400当旧密码错误时', async () => {
      const oldHashedPassword = await bcrypt.hash('correctpassword', 10);
      req.user = { id: 1 };
      req.body = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword',
      };

      const mockUserInstance = {
        id: 1,
        password: oldHashedPassword,
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '旧密码错误' });
    });
  });

  describe('getAllUsers (admin)', () => {
    it('应该返回所有用户列表', async () => {
      req.user = { id: 1, role: 'admin' };

      User.findAll.mockResolvedValue([
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
        { id: 2, username: 'user1', email: 'user1@example.com', role: 'user' },
      ]);

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ username: 'admin' }),
          expect.objectContaining({ username: 'user1' }),
        ])
      );
    });
  });

  describe('deleteUser (admin)', () => {
    it('应该成功删除用户', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '2' };

      const mockUserInstance = {
        id: 2,
        username: 'user1',
        role: 'user',
        destroy: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      await deleteUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: '用户删除成功' });
    });

    it('应该返回400当试图删除自己时', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '1' };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '不能删除自己的账号' });
    });

    it('应该返回403当试图删除管理员时', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '3' };

      const mockAdminUser = {
        id: 3,
        username: 'admin2',
        role: 'admin',
      };
      User.findByPk.mockResolvedValue(mockAdminUser);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '不能删除管理员账号' });
    });

    it('应该返回404当用户不存在时', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '999' };

      User.findByPk.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
    });
  });

  describe('updateUserRole (admin)', () => {
    it('应该成功更新用户角色', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '2' };
      req.body = { role: 'admin' };

      const mockUserInstance = {
        id: 2,
        username: 'user1',
        role: 'user',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      await updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '角色更新成功',
          user: expect.objectContaining({ role: 'admin' }),
        })
      );
    });

    it('应该返回400当角色无效时', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '2' };
      req.body = { role: 'superadmin' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '无效的角色' });
    });

    it('应该返回400当试图修改自己的角色时', async () => {
      req.user = { id: 1, role: 'admin' };
      req.params = { id: '1' };
      req.body = { role: 'user' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '不能修改自己的角色' });
    });
  });
});
