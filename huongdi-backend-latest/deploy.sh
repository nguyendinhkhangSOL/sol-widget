#!/bin/bash
# ============================================================
# HUONGDI.SOL.VN — Deploy Script
# Server: 103.72.57.11 (eztech.vn)
# Usage: ./deploy.sh
# Requires: .env file from admin (KHÔNG commit .env lên git)
# ============================================================

set -e

echo "🚀 Deploying huongdi-api..."

# ── 1. Install dependencies ───────────────────────────────
npm ci --omit=dev

# ── 2. Generate Prisma client ─────────────────────────────
npx prisma generate

# ── 3. Run DB migrations ──────────────────────────────────
echo "📦 Running DB migrations..."
npx prisma migrate deploy

# ── 4. Build TypeScript ───────────────────────────────────
echo "🔨 Building..."
npm run build

# ── 5. Seed (only first deploy — skip if data exists) ─────
# Uncomment on first deploy:
# echo "🌱 Seeding..."
# npx tsx prisma/seed.ts

# ── 6. Restart PM2 ───────────────────────────────────────
echo "♻️  Restarting PM2..."
pm2 startOrReload ecosystem.config.js --env production

echo "✅ Deploy complete!"
echo "   API: https://huongdi.sol.vn/api/health"
echo "   Admin: https://adminhuongdi.sol.vn"
