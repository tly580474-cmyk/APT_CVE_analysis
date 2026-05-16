const fs = require('fs').promises;
const path = require('path');

// Mock fs and models before requiring controller
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      readdir: jest.fn(),
      stat: jest.fn(),
      readFile: jest.fn(),
    },
  };
});

jest.mock('../../src/models', () => ({
  CVE: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

const { CVE } = require('../../src/models');
const {
  getAllCVEs,
  getCVEById,
  searchCVEs,
  getHotCVEs,
  getCVEStats,
} = require('../../src/controllers/cveController');

describe('CVE Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getAllCVEs', () => {
    it('应该返回CVE列表（默认分页）', async () => {
      fs.readdir.mockResolvedValueOnce(['2024', '2023']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce(['CVE-2024-0001.md', 'CVE-2024-0002.md']);
      fs.readdir.mockResolvedValueOnce(['CVE-2023-0001.md']);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest description\n### Reference\nVulnerability&message=High&'
      );

      await getAllCVEs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cves: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          totalPages: expect.any(Number),
        })
      );
    });

    it('应该支持分页参数', async () => {
      fs.readdir.mockResolvedValueOnce(['2024']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce([
        'CVE-2024-0001.md',
        'CVE-2024-0002.md',
        'CVE-2024-0003.md',
      ]);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest\n### Reference\nVulnerability&message=Low&'
      );

      req.query = { page: '2', limit: '1' };

      await getAllCVEs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });

    it('应该支持搜索过滤', async () => {
      fs.readdir.mockResolvedValueOnce(['2024']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce([
        'CVE-2024-0001.md',
        'CVE-2024-0002.md',
      ]);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest\n###\nVulnerability&message=Critical&'
      );

      req.query = { search: '0001' };

      await getAllCVEs(req, res);

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.cves.length).toBeLessThanOrEqual(2);
    });

    it('应该返回空列表当文件系统出错时（getCVEFilesFromRepo内部捕获）', async () => {
      fs.readdir.mockRejectedValue(new Error('FS error'));

      await getAllCVEs(req, res);

      // getCVEFilesFromRepo 内部捕获错误并返回空数组，不会触发500
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cves: [],
          total: 0,
        })
      );
    });
  });

  describe('getCVEById', () => {
    it('应该返回单个CVE详情', async () => {
      req.params = { id: 'CVE-2024-0001' };

      // Mock the file system calls for getCVEDetailFromFile
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nCritical vulnerability\n### Reference\nhttps://example.com\n### Github\nhttps://github.com/example\nVulnerability&message=Critical&'
      );

      await getCVEById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'CVE-2024-0001',
          severity: 'Critical',
        })
      );
    });

    it('应该返回404当CVE不存在时', async () => {
      req.params = { id: 'CVE-9999-9999' };

      fs.readFile.mockRejectedValue(new Error('File not found'));
      CVE.findByPk.mockResolvedValue(null);

      await getCVEById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'CVE不存在' });
    });

    it('应该从数据库获取CVE当文件不存在时', async () => {
      req.params = { id: 'CVE-2024-0001' };

      fs.readFile.mockRejectedValue(new Error('File not found'));
      const mockCVE = {
        id: 'CVE-2024-0001',
        title: 'Test CVE',
        heat: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      CVE.findByPk.mockResolvedValue(mockCVE);

      await getCVEById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCVE);
      expect(mockCVE.heat).toBe(1);
    });
  });

  describe('searchCVEs', () => {
    it('应该返回搜索结果', async () => {
      req.query = { q: '0001' };

      fs.readdir.mockResolvedValueOnce(['2024']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce(['CVE-2024-0001.md', 'CVE-2024-0002.md']);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest\n###\nVulnerability&message=High&'
      );

      await searchCVEs(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('应该返回400当没有提供搜索关键词时', async () => {
      req.query = {};

      await searchCVEs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '请提供搜索关键词' });
    });
  });

  describe('getHotCVEs', () => {
    it('应该返回热门CVE列表', async () => {
      req.query = { limit: '2' };

      fs.readdir.mockResolvedValueOnce(['2024']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce(['CVE-2024-0001.md', 'CVE-2024-0002.md']);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest\n###\nVulnerability&message=Medium&'
      );

      await getHotCVEs(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('getCVEStats', () => {
    it('应该返回CVE统计数据', async () => {
      fs.readdir.mockResolvedValueOnce(['2024']);
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValueOnce([
        'CVE-2024-0001.md',
        'CVE-2024-0002.md',
      ]);
      fs.readFile.mockResolvedValue(
        '### [CVE-2024-0001]\n### Description\nTest\n###\nVulnerability&message=Critical&'
      );

      await getCVEStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.any(Number),
          bySeverity: expect.objectContaining({
            Critical: expect.any(Number),
            High: expect.any(Number),
            Medium: expect.any(Number),
            Low: expect.any(Number),
            Unknown: expect.any(Number),
          }),
        })
      );
    });
  });
});
