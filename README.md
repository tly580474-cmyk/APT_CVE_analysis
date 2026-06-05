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
- React 19
- Ant Design 6
- Tailwind CSS 4
- ECharts 6
- React Router 7
- Axios
- Vite 8

### 后端
- Node.js 20
- Express 5
- PostgreSQL 15
- Sequelize 6 ORM
- JWT认证
- Multer文件上传

### AI集成
- OpenAI兼容API（支持多种服务商）

## 项目结构

```
APT攻击情报分析d/
├── frontend/              # React前端项目
│   ├── src/
│   │   ├── components/    # 组件（Layout、Sidebar等）
│   │   ├── pages/         # 页面（Forum、CVE等）
│   │   ├── services/      # API服务层
│   │   ├── contexts/      # React Context（暗黑模式、侧边栏）
│   │   └── styles/        # 样式文件
│   └── package.json
├── backend/               # Express后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # Sequelize数据模型
│   │   ├── routes/        # 路由定义
│   │   ├── middlewares/   # 中间件（JWT认证等）
│   │   └── config/        # 数据库配置
│   └── package.json
├── cve_repo/              # CVE漏洞数据（15万+ Markdown文件）
│   ├── 1999/
│   ├── 2000/
│   └── ...2026/
├── scripts/               # 工具脚本
├── docker-compose.yml     # Docker编排配置
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
- 管理员权限控制

### 2. 文档管理
- 文档上传（支持PDF、Word、TXT、Markdown等格式）
- 文档列表和详情查看
- AI智能分析
- 威胁等级评估

### 3. CVE漏洞信息
- 15万+ CVE漏洞数据（1999-2026年）
- 漏洞搜索和筛选
- 热门CVE排行
- POC可用性统计
- AI分类脚本

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
- 浏览量统计（带去重机制）

### 6. AI分析
- 文档内容智能分析
- 威胁等级自动评估
- 攻击类型识别
- 防护建议生成
- SSE流式输出

### 7. UI特性
- 深色/浅色主题切换
- 可折叠侧边栏
- 响应式布局（移动端底部导航）
- 中文界面

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 文档接口
- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 创建文档
- `POST /api/documents/upload` - 上传文档
- `GET /api/documents/:id` - 获取文档详情
- `PUT /api/documents/:id` - 更新文档
- `DELETE /api/documents/:id` - 删除文档

### CVE接口
- `GET /api/cve` - 获取CVE列表
- `GET /api/cve/:id` - 获取CVE详情
- `GET /api/cve/search` - 搜索CVE
- `GET /api/cve/hot` - 获取热门CVE
- `GET /api/cve/stats` - CVE统计数据

### AI分析接口
- `POST /api/ai/analyze` - 分析文档
- `POST /api/ai/analyze-stream` - 流式分析（SSE）
- `POST /api/ai-analysis/analyze` - 文件/文本分析
- `POST /api/ai-analysis/analyze-stream` - 流式分析

### 论坛接口
- `GET /api/forum/posts` - 获取帖子列表
- `POST /api/forum/posts` - 创建帖子（需登录）
- `GET /api/forum/posts/:id` - 获取帖子详情
- `PUT /api/forum/posts/:id` - 更新帖子（作者/管理员）
- `DELETE /api/forum/posts/:id` - 删除帖子（作者/管理员）
- `POST /api/forum/posts/:id/like` - 点赞帖子（需登录）
- `POST /api/forum/posts/:id/comments` - 添加评论（需登录）

### 统计接口
- `GET /api/stats` - 获取平台统计数据

## 环境变量

### 后端环境变量 (.env)
```bash
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

<<<<<<< Updated upstream
# OpenAI API配置
OPENAI_API_URL=
OPENAI_API_KEY=your_api_key
=======
# AI分析配置
AI_BASE_URL=https://api.example.com/v1
AI_API_KEY=your_api_key
AI_MODEL=gpt-4
>>>>>>> Stashed changes
```

## 开发命令

### 前端
```bash
cd frontend
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 生产构建
npm run lint         # ESLint检查
```

### 后端
```bash
cd backend
npm run dev          # 启动开发服务器 (nodemon, http://localhost:3001)
npm run start        # 生产启动
npm test             # 运行测试
npm run test:coverage # 测试覆盖率
```

### Docker
```bash
docker-compose up --build   # 启动所有服务
docker-compose down         # 停止所有服务
```

## 许可证

无
