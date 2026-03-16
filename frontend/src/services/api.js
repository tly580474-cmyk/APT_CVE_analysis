import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  // 管理员接口
  getAllUsers: () => api.get('/auth/users'),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  updateUserRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
};

// 文档API
export const documentAPI = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// CVE API
export const cveAPI = {
  getAll: (page = 1, limit = 15, search = '') => api.get(`/cve?page=${page}&limit=${limit}&search=${search}`),
  getById: (id) => api.get(`/cve/${id}`),
  search: (query) => api.get(`/cve/search?q=${query}`),
  getHot: (limit = 4) => api.get(`/cve/hot?limit=${limit}`),
  getStats: () => api.get('/cve/stats'),
};

// AI分析API
export const aiAPI = {
  analyze: (documentId) => api.post('/ai/analyze', { documentId }),
};

// 论坛API
export const forumAPI = {
  getPosts: () => api.get('/forum/posts'),
  getPost: (id) => api.get(`/forum/posts/${id}`),
  createPost: (data) => api.post('/forum/posts', data),
  updatePost: (id, data) => api.put(`/forum/posts/${id}`, data),
  deletePost: (id) => api.delete(`/forum/posts/${id}`),
  addComment: (postId, data) => api.post(`/forum/posts/${postId}/comments`, data),
  deleteComment: (postId, commentId) => api.delete(`/forum/posts/${postId}/comments/${commentId}`),
  likePost: (id) => api.post(`/forum/posts/${id}/like`),
  // 管理员接口
  getAllComments: () => api.get('/forum/comments'),
  adminDeletePost: (id) => api.delete(`/forum/admin/posts/${id}`),
  adminDeleteComment: (id) => api.delete(`/forum/admin/comments/${id}`),
};

// 统计API
export const statsAPI = {
  getThreatLevels: () => api.get('/stats/threat-levels'),
  getHeatRankings: () => api.get('/stats/heat-rankings'),
  getCVEAnalysis: () => api.get('/stats/cve-analysis/parsed'),
};

// 上传API
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// AI智能分析API
export const aiAnalysisAPI = {
  getConfig: () => api.get('/ai-analysis/config'),
  analyzeFile: (filePath, customPrompt) => api.post('/ai-analysis/analyze-file', { filePath, customPrompt }),
  analyzeText: (content, customPrompt) => api.post('/ai-analysis/analyze-text', { content, customPrompt }),
};

export default api;
