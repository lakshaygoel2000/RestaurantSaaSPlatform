#!/bin/bash
# RestaurantOS Deploy Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: local (default), production

set -e

ENV=${1:-local}
echo "=== RestaurantOS Deploy Script ==="
echo "Environment: $ENV"

# Install dependencies
echo "[1/5] Installing dependencies..."
pnpm install

# Build for production
echo "[2/5] Building..."
pnpm run build

# Push database schema
echo "[3/5] Pushing database schema..."
pnpm exec drizzle-kit push --force

# Seed test data
echo "[4/5] Seeding test data..."
npx tsx db/seed.ts

# Sync Capacitor if Android project exists
if [ -d "android" ]; then
    echo "[5/5] Syncing Capacitor..."
    npx cap sync android
fi

echo ""
echo "=== Deploy Complete ==="
echo "Start the server with: pnpm start"
echo "Or dev mode: pnpm run dev"
echo ""
echo "For cPanel/shared hosting, upload these artifacts instead of running this script:"
echo "  - server.js"
echo "  - dist/server.js"
echo "  - dist/public/"
echo "  - package.json + pnpm-lock.yaml (or pre-installed node_modules)"
echo ""
echo "Build APK:"
echo "  cd android && ./gradlew assembleDebug"
