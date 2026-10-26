#!/usr/bin/env bash
# OrthoCross — iOS build prep (run on a Mac with Xcode + CocoaPods + Node 18+).
# This does everything up to the point where Xcode takes over for signing.
# Safe to re-run on an existing ios/ project (it never re-scaffolds one).
# Usage:  bash scripts-ios-build.sh
set -euo pipefail
cd "$(dirname "$0")"

BUNDLE_ID="com.lZASURkwsofX.OrthoCross"   # must match the existing App Store listing

echo "==> 1/6 installing dependencies"
npm ci

echo "==> 2/6 building the web app (.env.production = our Supabase backend, whatever .env says)"
npm run build

echo "==> 3/6 scaffolding the iOS platform (first run only)"
if [ ! -d ios ]; then
  npx cap add ios
fi

echo "==> 4/6 syncing web assets + native plugins into iOS"
npx cap sync ios

echo "==> 5/6 setting the App Store bundle identifier to $BUNDLE_ID"
PBX="ios/App/App.xcodeproj/project.pbxproj"
# Capacitor scaffolds with com.orthocross.myapp (the Android id); the iOS listing
# uses a different permanent id, so rewrite it here.
sed -i '' "s/com\.orthocross\.myapp/$BUNDLE_ID/g" "$PBX"
echo "    bundle id set."

echo "==> 6/6 writing permission strings + encryption flag into Info.plist"
npm run ios:plist

echo ""
echo "DONE. Now open Xcode and do the signing + upload (see IOS-HANDOFF.md):"
echo "    npx cap open ios"
