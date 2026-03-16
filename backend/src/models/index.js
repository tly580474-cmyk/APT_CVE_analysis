const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// 文档模型
const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  threatLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true,
  },
  heat: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'analyzing', 'completed'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'documents',
  timestamps: true,
});

// CVE模型
const CVE = sequelize.define('CVE', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    allowNull: true,
  },
  cvssScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  published: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastModified: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pocUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  references: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  affectedProducts: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  heat: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'cves',
  timestamps: true,
});

// 论坛帖子模型
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'posts',
  timestamps: true,
});

// 评论模型
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id',
    },
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id',
    },
  },
}, {
  tableName: 'comments',
  timestamps: true,
});

// 建立关联关系
User.hasMany(Document, { foreignKey: 'authorId' });
Document.belongsTo(User, { foreignKey: 'authorId' });

User.hasMany(Post, { foreignKey: 'authorId' });
Post.belongsTo(User, { foreignKey: 'authorId' });

User.hasMany(Comment, { foreignKey: 'authorId' });
Comment.belongsTo(User, { foreignKey: 'authorId' });

Post.hasMany(Comment, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// 点赞关联模型
const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id',
    },
  },
}, {
  tableName: 'post_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId']
    }
  ]
});

User.hasMany(PostLike, { foreignKey: 'userId' });
PostLike.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(PostLike, { foreignKey: 'postId' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });

module.exports = {
  User,
  Document,
  CVE,
  Post,
  Comment,
  PostLike,
  sequelize,
};
