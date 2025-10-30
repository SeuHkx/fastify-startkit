# Fastify Start Kit

基于 Fastify + TypeScript + Prisma + Alpine.js 构建的全栈应用开发脚手架，提供完整的开发、构建和部署方案。

## 📋 目录

- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [构建打包](#构建打包)
- [部署方案](#部署方案)
- [项目结构](#项目结构)
- [配置说明](#配置说明)

## 🛠 技术栈

### 后端
- **Fastify** - 高性能 Node.js Web 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Prisma** - 现代化的 ORM 工具
- **Pino** - 高性能日志记录
- **PM2** - 生产环境进程管理

### 前端
- **Alpine.js** - 轻量级响应式框架
- **Handlebars** - 模板引擎
- **Bulma** - CSS 框架

### 构建工具
- **Webpack** - 模块打包器
- **Babel** - JavaScript 编译器
- **JavaScript Obfuscator** - 代码混淆工具

## 📦 环境要求

- **Node.js**: >= 18.x
- **pnpm**: >= 10.0.0
- **操作系统**: macOS / Linux / Windows

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

> **注意**: 首次安装可能需要根据系统环境编译部分原生模块（如 `fsevents`），根据提示选择即可。

### 2. 环境配置

项目使用不同的配置文件管理不同环境：

- `config/default.yaml` - 默认配置
- `config/development.yaml` - 开发环境配置
- `config/production.yaml` - 生产环境配置

创建环境变量文件：

```bash
# 开发环境
cp .env.development.example .env.development

# 生产环境
cp .env.production.example .env.production
```

### 3. 数据库初始化

项目使用 Prisma 作为 ORM，默认配置为 SQLite：

```bash
# 初始化数据库并执行迁移
pnpm run prisma:migrate

# 查看 Prisma Studio（可选）
pnpm exec prisma studio
```

### 4. 启动开发服务

```bash
# 推荐：启动完整开发环境（TypeScript + 模板监听）
pnpm run dev

# 或仅启动 TypeScript 开发服务
pnpm run dev:ts

# 或启动 JavaScript 开发服务（需先编译）
pnpm run dev:js
```

开发服务启动后，访问 `http://localhost:3000`（端口可在配置文件中修改）。

## 💻 开发指南

### 目录结构

```
src/
├── server.ts              # 服务入口
├── controllers/           # 业务控制器
├── services/              # 业务逻辑层
├── routes/                # 路由定义
├── plugins/               # Fastify 插件
├── utils/                 # 工具函数
└── views/                 # 服务端视图模板

client/
├── views/                 # 前端页面组件
├── templates/             # Handlebars 模板
└── build-templates.ts     # 模板构建脚本

prisma/
├── schema.prisma          # 数据库模型定义
└── dev.db                 # SQLite 数据库文件（开发）

public/
├── css/                   # 样式文件
├── js/                    # 前端 JavaScript 库
└── dist/                  # 构建产物（自动生成）
```

### 可用脚本

#### 开发命令

```bash
# 完整开发环境（推荐）
pnpm run dev                    # TypeScript 服务 + 模板热重载

# 分离式开发
pnpm run dev:ts                 # 仅 TypeScript 服务
pnpm run templates:watch        # 仅模板监听
pnpm run templates:build        # 构建模板（一次性）
```

#### 数据库命令

```bash
pnpm run prisma:init            # 初始化 Prisma
pnpm run prisma:migrate         # 执行数据库迁移
pnpm run prisma:dev             # 同步数据库结构（开发）
pnpm run prisma:reset           # 重置数据库
pnpm run prisma:validate        # 验证 schema 文件
```

#### 构建命令

```bash
pnpm run build:ts               # 编译 TypeScript
pnpm run templates:build        # 构建前端模板
pnpm run build                  # 完整构建（TS + 模板）
pnpm run webpack                # 生产构建（含代码混淆）
```

### 开发注意事项

1. **TypeScript 路径别名**: 项目使用 `tsconfig-paths` 支持路径别名，编译后使用 `tsc-alias` 转换
2. **日志输出**: 开发环境使用 `pino-pretty` 格式化日志，生产环境使用 JSON 格式
3. **热重载**: 使用 `ts-node-dev` 实现 TypeScript 代码热重载
4. **前端开发**: Alpine.js 组件在 `x-*` 属性中编写，避免在属性中使用大型 JSON

## 📦 构建打包

### 标准构建

```bash
# 生产环境完整构建
pnpm run webpack
```

构建产物输出到 `app/` 目录，包含：
- 编译并混淆的服务端代码
- 前端资源文件
- 配置文件
- PM2 配置
- 依赖包

### 构建特性

#### 代码混淆
- **后端代码**: 通过 Webpack + JavaScript Obfuscator 混淆
- **前端代码**: 仅混淆 `public/dist` 下的应用代码，跳过第三方库和 `*.min.js`

#### 环境变量控制

```bash
# 禁用前端代码混淆（用于排障）
DISABLE_CLIENT_OBFUSCATION=1 pnpm run webpack

# 使用轻量级混淆（更安全）
REDUCE_CLIENT_OBFUSCATION=1 pnpm run webpack

# 生成 SourceMap（仅用于测试）
OBFUSCATE_SOURCEMAP=1 pnpm run webpack
```

#### 视图压缩注意事项
- EJS 模板已关闭 `minifyJS` 和 `minifyCSS`，保留属性引号
- 避免在 `x-*` 属性中直接内联大型 JSON
- 推荐使用 `<script type="application/json">` 承载数据

### 测试构建产物

```bash
# 在本地测试打包后的代码
pnpm run start:test

# 或手动测试
cd app
cross-env NODE_ENV=production node bin/server.js
```

## 🚢 部署方案

项目支持三种部署方式：**PM2 部署**、**CentOS 自动化部署** 和 **Docker 容器化部署**。

### 方案一：PM2 部署

适用于已有 Node.js 环境的服务器。

#### 1. 构建项目

```bash
pnpm run webpack
```

#### 2. 上传 `app` 目录

将生成的 `app/` 目录上传到服务器。

#### 3. 在服务器上启动

```bash
cd app

# 安装依赖（如果有）
pnpm install --prod

# 启动生产服务
pnpm run start:prod

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup
```

#### 常用 PM2 命令

```bash
pm2 status                      # 查看进程状态
pm2 logs --lines 200           # 查看日志
pm2 restart all                # 重启所有进程
pm2 stop all                   # 停止所有进程
pm2 delete all                 # 删除所有进程
pm2 monit                      # 实时监控
```

### 方案二：CentOS 自动化部署

使用脚本一键部署到 CentOS 服务器，自动配置 PM2 和日志轮转。

#### 1. 生成部署包

在构建机上执行：

```bash
./scripts/package-for-deploy.sh
```

生成的部署包位于 `releases/` 目录，格式：`hardwareNode-app-<version>-<timestamp>.tar.gz`

#### 2. 上传到服务器

```bash
scp releases/hardwareNode-app-*.tar.gz user@server:/tmp/
```

#### 3. 执行部署脚本

```bash
# 在服务器上执行
./scripts/deploy-on-centos.sh /tmp/hardwareNode-app-*.tar.gz /opt/hardwareNode
```

脚本会自动：
- 解压到指定目录
- 安装 pnpm 和 PM2（如未安装）
- 安装生产依赖
- 配置 pm2-logrotate（日志轮转）
- 启动服务并设置开机自启

#### 日志轮转配置

- **单文件上限**: 20MB
- **保留数量**: 7 个压缩文件
- **轮转周期**: 按天

更多详情请查看 [DEPLOY.md](./DEPLOY.md)

### 方案三：Docker 部署

适用于容器化环境。

#### 1. 构建镜像

```bash
# 构建 Docker 镜像
docker build -t fastify-startkit:latest .

# 或使用 app 目录的 Dockerfile（仅运行时）
cd app
docker build -t fastify-startkit:latest .
```

#### 2. 运行容器

```bash
docker run -d \
  --name fastify-app \
  -p 3000:3000 \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  fastify-startkit:latest
```

#### 3. 使用 Docker Compose（推荐）

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: fastify-app
    ports:
      - "3000:3000"
    volumes:
      - ./prisma:/app/prisma
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

启动服务：

```bash
docker-compose up -d
```

## 📁 项目结构

```
.
├── app/                       # 构建产物目录（自动生成）
├── client/                    # 前端源码
│   ├── templates/             # Handlebars 模板
│   └── views/                 # 页面视图
├── config/                    # 配置文件
├── prisma/                    # Prisma ORM
│   └── schema.prisma          # 数据模型定义
├── public/                    # 静态资源
│   ├── css/                   # 样式文件
│   ├── js/                    # JavaScript 库
│   └── dist/                  # 编译产物
├── scripts/                   # 部署脚本
├── src/                       # 后端源码
│   ├── server.ts              # 应用入口
│   ├── controllers/           # 控制器
│   ├── services/              # 服务层
│   ├── routes/                # 路由
│   ├── plugins/               # 插件
│   └── utils/                 # 工具函数
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── Dockerfile                 # Docker 配置
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
└── webpack.config.ts          # Webpack 配置
```

## ⚙️ 配置说明

### 环境变量

主要环境变量在 `.env.development` 和 `.env.production` 中配置：

```env
# 数据库连接
DATABASE_URL="file:./prisma/dev.db"

# 服务配置
NODE_ENV=development
PORT=3000

# JWT 配置
JWT_SECRET=your-secret-key

# 日志配置
LOG_LEVEL=info
LOG_PATH=./logs
```

### Prisma 配置

修改 `prisma/schema.prisma` 切换数据库：

```prisma
datasource db {
  provider = "sqlite"           # 或 "postgresql" / "mysql"
  url      = env("DATABASE_URL")
}
```

### PM2 配置

修改 `app/bin/ecosystem.config.js` 自定义 PM2 配置：

```javascript
module.exports = {
  apps: [{
    name: 'fastify-app',
    script: './server.js',
    instances: 2,              // 实例数量
    exec_mode: 'cluster',      // 集群模式
    max_memory_restart: '500M',
    // ... 更多配置
  }]
}
```

## 📚 更多文档

- [部署详细说明](./DEPLOY.md)
- [Fastify 官方文档](https://fastify.dev/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Alpine.js 文档](https://alpinejs.dev/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE)


