const { Post, Comment, User, PostLike } = require('../models');

// 获取所有帖子（公开 - 无需登录）
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // 转换posts，添加authorId
    const postsWithAuthorId = posts.map(post => ({
      ...post.toJSON(),
      authorId: post.authorId,
    }));

    res.json({
      posts: postsWithAuthorId,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个帖子（公开 - 无需登录）
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 增加浏览量
    post.views += 1;
    await post.save();

    // 返回完整数据，包含authorId
    res.json({
      ...post.toJSON(),
      authorId: post.authorId,
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建帖子（需要登录）
const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      authorId: req.user.id,
    });

    const postWithUser = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    res.status(201).json({
      message: '帖子创建成功',
      post: postWithUser,
    });
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新帖子
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 检查权限：作者本人或管理员
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此帖子' });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;
    await post.save();

    res.json({
      message: '帖子更新成功',
      post,
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除帖子
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 检查权限：作者本人或管理员
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此帖子' });
    }

    await post.destroy();
    res.json({ message: '帖子删除成功' });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 添加评论（需要登录）
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = await Comment.create({
      content,
      authorId: req.user.id,
      postId: id,
      parentId: parentId || null,
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    res.status(201).json({
      message: '评论添加成功',
      comment: commentWithUser,
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除评论
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查权限：评论作者本人或管理员
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此评论' });
    }

    await comment.destroy();
    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 点赞帖子（需要登录）
const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 检查是否已经点过赞
    const existingLike = await PostLike.findOne({
      where: { userId, postId: id }
    });

    if (existingLike) {
      return res.status(400).json({ message: '您已经点过赞了' });
    }

    // 创建点赞记录
    await PostLike.create({ userId, postId: id });

    // 增加帖子点赞数
    post.likes += 1;
    await post.save();

    res.json({ message: '点赞成功', likes: post.likes });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// ========== 管理员功能 ==========

// 获取所有评论（管理员）
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await Comment.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Post,
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      comments,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员删除任意帖子
const adminDeletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    await post.destroy();
    res.json({ message: '帖子删除成功' });
  } catch (error) {
    console.error('管理员删除帖子错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员删除任意评论
const adminDeleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    await comment.destroy();
    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('管理员删除评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
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
  adminDeleteComment,
};
