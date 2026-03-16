FROM node:20-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p src/uploads

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
