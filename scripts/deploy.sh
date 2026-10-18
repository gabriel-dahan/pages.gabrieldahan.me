#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/gabrieldahan.me/pages}"
RESUME_BASE_URL="${RESUME_BASE_URL:-https://raw.githubusercontent.com/gabriel-dahan/my-resume/main}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Deploying pages from $(pwd) (branch: $BRANCH)"

if [ ! -d .git ]; then
  echo "err: $APP_DIR is not a git repository" >&2
  exit 1
fi

echo "==> Updating source"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Syncing resumes from my-resume"
mkdir -p public/files
curl -fsSL "$RESUME_BASE_URL/en/resume_en.pdf" -o public/files/resume_en.pdf
curl -fsSL "$RESUME_BASE_URL/fr/resume_fr.pdf" -o public/files/resume_fr.pdf

echo "==> Installing dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Building frontend + server"
npm run build
npm run build:server

echo "==> Reloading pm2"
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save
else
  echo "err: pm2 is not installed. Install with: npm i -g pm2" >&2
  exit 1
fi

echo "==> Deploy complete"
pm2 status pages || true
