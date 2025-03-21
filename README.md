## 项目启动

### 使用说明
项目依赖于node18版本以上，pnpm10.0.0

### 安装依赖
    pnpm install
第一次安装依赖可能会根据系统环境进行一些包的编译，根据提示进行全部选择。

### 数据迁移
    pnpm run prisma:migrate
需要更多的操作请查看prisma的文档，基础的配置请查看package.json里面的脚本

### 启动开发环境(ts)
    pnpm run dev:ts
因本项目是通过ts构建基于，开发环境建议启用ts

### 启动开发环境(js)
    pnpm run dev:js
ts编译过后的js代码

### 打包
    pnpm run webpack
进行代码简单的加密以及混淆

### 部署
打包过后的代码会生成app目录，进行pm2部署，进入到app目录，执行一下脚本命令

    pnpm run start:prod
也可以进行测试打包过后的代码是否运行正常（因为会遇到原生模块c++之类的会有初始化编译问题，需要动态调整webpack的配置）

    pnpm run start:test

### docker
也可以进行容器化部署，请查阅相关docker的文档


