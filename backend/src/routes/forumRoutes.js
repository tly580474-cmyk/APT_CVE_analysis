const express = require('express');
const router = express.Router();
const { 
  getAllPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  addComment, 
  deleteComment,
  likePost,
  getAllComments,
  adminDeletePost,
  adminDeleteComment
} = require('../controllers/forumController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 公开路由 - 无需登录
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);

// 需要登录的路由
router.post('/posts', authMiddleware, createPost);
router.put('/posts/:id', authMiddleware, updatePost);
router.delete('/posts/:id', authMiddleware, deletePost);
router.post('/posts/:id/comments', authMiddleware, addComment);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, deleteComment);
router.post('/posts/:id/like', authMiddleware, likePost);

// 管理员路由
router.get('/comments', authMiddleware, adminMiddleware, getAllComments);
router.delete('/admin/posts/:id', authMiddleware, adminMiddleware, adminDeletePost);
router.delete('/admin/comments/:id', authMiddleware, adminMiddleware, adminDeleteComment);

module.exports = router;
