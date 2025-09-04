#!/usr/bin/env bash
set -euo pipefail

# 在 CentOS 服务器上执行此脚本
# 用法：
#   ./scripts/deploy-on-centos.sh <package.tgz> [deploy_dir]
# 例如：
#   ./scripts/deploy-on-centos.sh releases/hardwareNode-app-1.0.0-20250101-120000.tar.gz /opt/hardwareNode

PKG_PATH=${1:-}
DEPLOY_DIR=${2:-/opt/hardwareNode}

if [[ -z "$PKG_PATH" ]]; then
  echo "Usage: $0 <package.tgz> [deploy_dir]"
  exit 1
fi

echo "Deploy package: $PKG_PATH -> $DEPLOY_DIR"

sudo mkdir -p "$DEPLOY_DIR"
sudo chown -R "$USER":"$USER" "$DEPLOY_DIR"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Extracting package..."
tar -C "$TMP_DIR" -xzf "$PKG_PATH"

echo "Sync files to $DEPLOY_DIR/app ..."
mkdir -p "$DEPLOY_DIR/app"
rsync -a --delete "$TMP_DIR"/ "$DEPLOY_DIR/app"/

cd "$DEPLOY_DIR/app"

echo "Install Node.js, pnpm, pm2 if missing..."
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js 18+ before continue."
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Install pnpm..."
  corepack enable || true
  corepack prepare pnpm@10.11.0 --activate || npm i -g pnpm
fi
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Install pm2..."
  pnpm dlx pm2 -v >/dev/null 2>&1 || npm i -g pm2
fi

echo "Install production deps (if any)..."
# 当前 app 的 package.json 几乎不需要在服务器编译，但保持一致性
pnpm install --prod --frozen-lockfile || pnpm install --prod

echo "Ensure logs directory exists..."
mkdir -p logs/error logs/outs

echo "Setup pm2-logrotate for size limit and retention..."
if ! pm2 ls | grep -q logrotate; then
  pm2 install pm2-logrotate || true
fi
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 60
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

echo "Start app via pm2..."
pnpm run start:prod || pm2 start bin/ecosystem.config.js --env production

echo "Save pm2 process list and enable startup on boot..."
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" || true

echo "Deployment complete. PM2 status:"
pm2 status
