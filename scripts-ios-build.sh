#!/usr/bin/env bash
# OrthoCross — iOS build prep (run on a Mac with Xcode + CocoaPods + Node 18+).
# This does everything up to the point where Xcode takes over for signing.
# Usage:  bash scripts-ios-build.sh
set -euo pipefail
cd "$(dirname "$0")"

BUNDLE_ID="com.lZASURkwsofX.OrthoCross"   # must match the existing App Store listing

echo "==> 1/5 installing dependencies"
npm ci

echo "==> 2/5 building the web app (uses .env = new Supabase backend)"
npm run build

echo "==> 3/5 scaffolding the iOS platform (first run only)"
if [ ! -d ios ]; then
  npx cap add ios
fi

echo "==> 4/5 syncing web assets + native plugins into iOS"
npx cap sync ios

echo "==> 5/5 setting the App Store bundle identifier to $BUNDLE_ID"
PBX="ios/App/App.xcodeproj/project.pbxproj"
# Capacitor scaffolds with com.orthocross.myapp (the Android id); the iOS listing
# uses a different permanent id, so rewrite it here.
sed -i '' "s/com\.orthocross\.myapp/$BUNDLE_ID/g" "$PBX"
echo "    bundle id set."

echo ""
echo "DONE. Now open Xcode and do the signing + upload (see IOS-HANDOFF.md):"
echo "    npx cap open ios"
