const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../../src/middlewares/auth');

// Mock models
jest.mock('../../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    save: jest.fn(),
  };
  return {
    User: {
      findByPk: jest.fn(),
    },
  };
});

const { User } = require('../../src/models');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('应该返回401当没有提供token时', async () => {
      req.headers.authorization = undefined;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '未提供认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当token格式错误时', async () => {
      req.headers.authorization = 'InvalidFormat';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '未提供认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当token无效时', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '无效的认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该返回401当用户不存在时', async () => {
      const token = jwt.sign(
        { id: 999, username: 'nonexistent', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${token}`;
      User.findByPk.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该成功认证并调用next', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'user',
      };
      const token = jwt.sign(
        { id: 1, username: 'testuser', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${token}`;
      User.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    it('应该返回403当用户不是管理员时', async () => {
      req.user = { id: 1, role: 'user' };

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '需要管理员权限' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该成功通过管理员权限检查', async () => {
      req.user = { id: 1, role: 'admin' };

      await adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
