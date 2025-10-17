# 部署说明（CentOS）

本项目打包输出到 `app/` 目录，使用 PM2 以生产模式运行，并通过 pm2-logrotate 控制日志大小与保留周期。

## 一、在构建机打包

1. 生成部署包

```bash
./scripts/package-for-deploy.sh
```

完成后会在 `releases/` 目录生成形如 `hardwareNode-app-<version>-<timestamp>.tar.gz` 的包。

## 二、上传到服务器

将 `releases/*.tar.gz` 上传到 CentOS 服务器，例如 `/tmp`。

## 三、在服务器部署

```bash
# 例如：
./scripts/deploy-on-centos.sh /tmp/hardwareNode-app-1.0.0-20250101-120000.tar.gz /opt/hardwareNode
```

脚本会：
- 解压到指定目录的 `app/` 下
- 安装（或确保存在）pnpm、pm2
- 安装生产依赖（如有）
- 安装并配置 pm2-logrotate（20MB 单文件上限，保留 7 个压缩轮转，按天轮转）
- 执行 `pnpm run start:prod`，即 `pm2 start bin/ecosystem.config.js --env production`
- `pm2 save` 并配置开机自启

## 四、常用 PM2 命令

```bash
pm2 status
pm2 logs --lines 200
pm2 restart all
pm2 stop all
pm2 delete all
```

## 备注

- 服务器需预先安装 Node.js（建议 18+）。
- 环境变量主要来自 `app/.env.production`，可按需修改端口、日志路径等。
- 日志文件路径由 `app/.env.production` 与 `app/bin/ecosystem.config.js` 决定。

## 前端混淆与视图压缩注意事项

- 视图压缩：构建阶段已对 `.ejs` 关闭 `minifyJS/minifyCSS` 且保留属性引号，避免破坏 `x-*` 指令表达式。
- 风险守卫：构建时会扫描 `x-(init|data|on|bind|model)` 属性，若检测到内联大型 JSON 或 `JSON.stringify` 会告警；在 CI 可设置 `STRICT_X_ATTR=1` 让构建失败，避免线上回归。
- 数据注入：不要在 `x-*` 属性中直接内联 JSON。推荐使用 `<script type="application/json">` 承载数据并在运行时解析到 `window` 变量，例如 `x-init="initWithData(window.__SIDEBAR_MENU)"`。
- 前端混淆：仅对 `public/dist` 应用代码做混淆，跳过第三方、*.min.js 与运行时文件。保守配置已关闭高风险项（controlFlowFlattening、rc4 等）。
- 环境开关：
	- `DISABLE_CLIENT_OBFUSCATION=1` 完全禁用前端混淆（排障用）
	- `REDUCE_CLIENT_OBFUSCATION=1` 降级为更安全的轻量混淆
	- `OBFUSCATE_SOURCEMAP=1` 生成单独 SourceMap（建议仅测试/预发启用）