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

const MockUser = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

const MockCVE = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

const MockDocument = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

const MockPost = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

const MockComment = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

module.exports = {
  User: MockUser,
  CVE: MockCVE,
  Document: MockDocument,
  Post: MockPost,
  Comment: MockComment,
  sequelize: {
    define: jest.fn(),
    sync: jest.fn(),
  },
  mockUser,
};
