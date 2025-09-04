#!/usr/bin/env bash
set -euo pipefail

# 打包当前项目为可部署的 tar.gz 包
# - 先执行 webpack 生成 app 目录
# - 生成 releases/hardwareNode-app-<version>-<timestamp>.tar.gz

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/3] Build with webpack..."
pnpm webpack

echo "[2/3] Resolve app version..."
APP_ENV_FILE="app/.env.production"
if [[ ! -f "$APP_ENV_FILE" ]]; then
  echo "Error: $APP_ENV_FILE not found."
  exit 1
fi
APP_VERSION=$(grep -E '^APP_VERSION=' "$APP_ENV_FILE" | head -n1 | cut -d'=' -f2 | tr -d '"' | tr -d "'" )
if [[ -z "${APP_VERSION:-}" ]]; then
  APP_VERSION="0.0.0"
fi

TS=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$ROOT_DIR/releases"
PKG_NAME="hardwareNode-app-${APP_VERSION}-${TS}.tar.gz"
mkdir -p "$RELEASE_DIR"

echo "[3/3] Create package ${PKG_NAME} ..."
tar -C "$ROOT_DIR/app" -czf "$RELEASE_DIR/$PKG_NAME" .

echo "Done. Package: $RELEASE_DIR/$PKG_NAME"
echo "Next: copy this file to your CentOS server and run scripts/deploy-on-centos.sh there."
