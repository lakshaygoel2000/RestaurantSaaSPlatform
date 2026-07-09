#!/bin/bash
# RestaurantOS Deploy Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: local (default), production

set -e

ENV=${1:-local}
echo "=== RestaurantOS Deploy Script ==="
echo "Environment: $ENV"

# Install dependencies
echo "[1/6] Installing dependencies..."
npm install

# Type check
echo "[2/6] Type checking..."
npm run check

# Build for production
echo "[3/6] Building..."
npm run build

# Push database schema
echo "[4/6] Pushing database schema..."
npm run db:push

# Seed test data
echo "[5/6] Seeding test data..."
npx tsx db/seed.ts

# Sync Capacitor if Android project exists
if [ -d "android" ]; then
    echo "[6/6] Syncing Capacitor..."
    npx cap sync android
fi

echo ""
echo "=== Deploy Complete ==="
echo "Start the server with: npm start"
echo "Or dev mode: npm run dev"
echo ""
echo "Build APK:"
echo "  cd android && ./gradlew assembleDebug"
