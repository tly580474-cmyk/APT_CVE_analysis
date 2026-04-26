# APT攻击情报分析平台

一个基于React + Node.js + PostgreSQL的APT攻击情报分析平台，提供文档管理、CVE漏洞信息集成、AI分析和论坛交流功能。

## 必备软件 (Prerequisites)

在启动项目之前，您需要安装以下软件：

### 1. Node.js (必须)
- **版本要求**: Node.js 20 LTS 或更高版本
- **下载地址**: https://nodejs.org/
- **验证安装**: 运行 `node --version` 应显示 v20.x.x 或更高

### 2. PostgreSQL (必须)
- **版本要求**: PostgreSQL 15 或更高版本
- **下载地址**: https://www.postgresql.org/download/
- **推荐方式**: 本地安装或者docker容器化

### 3. Docker Desktop (可选)
- **版本要求**: Docker 20.10+ 
- **下载地址**: https://www.docker.com/products/docker-desktop
- **用途**: 运行 PostgreSQL 数据库容器

### 4. Git (可选，用于版本控制)
- **下载地址**: https://git-scm.com/

## 技术栈

### 前端
- React 18
- Ant Design 5
- Tailwind CSS
- ECharts 5
- React Router 6
- Axios

### 后端
- Node.js 20
- Express 4
- PostgreSQL 15
- Sequelize ORM
- JWT认证
- Multer文件上传

### AI集成
- OpenAI API :

## 项目结构

```
APT攻击情报分析d/
├── frontend/          # React前端项目
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
├── backend/           # Express后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middlewares/   # 中间件
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml # Docker编排配置
└── README.md
```

## 快速开始

### 方式一：使用Docker Compose（推荐）

1. 确保已安装Docker和Docker Compose

2. 在项目根目录运行：
```bash
docker-compose up -d
```

3. 访问应用：
   - 前端：http://localhost
   - 后端API：http://localhost:3001/api

4. 停止服务：
```bash
docker-compose down
```

### 方式二：本地开发

#### 启动后端

1. 进入backend目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量（复制.env.example为.env并修改）：
```bash
cp .env.example .env
```

4. 启动PostgreSQL数据库（使用Docker）：
```bash
docker run -d --name postgres \
  -e POSTGRES_DB=apt_analysis \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15
```

5. 启动后端服务：
```bash
npm run dev
```

#### 启动前端

1. 进入frontend目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 访问 http://localhost:5173

## 主要功能

### 1. 用户认证
- 用户注册/登录
- JWT认证
- 个人资料管理

### 2. 文档管理
- 文档上传（支持PDF、Word、TXT等格式）
- 文档列表和详情查看
- AI智能分析
- 威胁等级评估

### 3. CVE漏洞信息
- CVE漏洞列表展示
- 漏洞搜索
- 热门CVE排行
- POC可用性统计

### 4. 数据可视化
- CVE数量按年份分布图
- 漏洞类型分布图
- 产品漏洞分布图
- POC可用性统计图

### 5. 论坛系统
- 帖子发布和管理
- 评论和回复
- 标签系统
- 点赞功能

### 6. AI分析
- 文档内容智能分析
- 威胁等级自动评估
- 攻击类型识别
- 防护建议生成

## API接口

### 认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/auth/me - 获取当前用户信息

### 文档接口
- GET /api/documents - 获取文档列表
- POST /api/documents - 创建文档
- POST /api/documents/upload - 上传文档
- GET /api/documents/:id - 获取文档详情
- PUT /api/documents/:id - 更新文档
- DELETE /api/documents/:id - 删除文档

### CVE接口
- GET /api/cve - 获取CVE列表
- GET /api/cve/:id - 获取CVE详情
- GET /api/cve/search - 搜索CVE
- GET /api/cve/hot - 获取热门CVE

### AI分析接口
- POST /api/ai/analyze - 分析文档
- POST /api/ai/analyze-stream - 流式分析（打字机效果）

### 论坛接口
- GET /api/forum/posts - 获取帖子列表
- POST /api/forum/posts - 创建帖子
- GET /api/forum/posts/:id - 获取帖子详情
- POST /api/forum/posts/:id/comments - 添加评论

## 环境变量

### 后端环境变量 (.env)
```
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apt_analysis
DB_USER=postgres
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3001
NODE_ENV=development

# OpenAI API配置
OPENAI_API_URL=https://free.v36.cm/v1
OPENAI_API_KEY=your_api_key
```

## 开发计划

- [x] 项目初始化和架构搭建
- [x] 前端UI组件开发
- [x] 后端API开发
- [x] 数据库设计和模型创建
- [x] 用户认证系统
- [x] 文档管理和上传功能
- [x] CVE漏洞信息集成
- [x] AI分析功能
- [x] 数据可视化
- [x] 论坛系统
- [x] Docker容器化部署

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License
