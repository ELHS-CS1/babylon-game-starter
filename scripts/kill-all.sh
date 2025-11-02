#!/bin/bash

# Kill All Development Processes Script
# This script kills all development servers and processes for the Babylon.js Multiplayer Game

echo "🔄 Killing all development processes..."

# Kill Node.js processes related to this project
echo "📦 Killing Node.js processes..."
pkill -f "node.*dist.*index" 2>/dev/null || true
pkill -f "nodemon.*dist" 2>/dev/null || true
pkill -f "tsc.*watch" 2>/dev/null || true
pkill -f "vite.*build" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true

# Kill processes on specific ports (but NOT the DataStar server on 10000)
echo "🔌 Killing processes on ports 3000, 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
# NOTE: NOT killing port 10000 to preserve DataStar server

# Kill any remaining npm processes for this project (but not the current one)
echo "📋 Killing npm processes..."
pkill -f "npm run dev:server" 2>/dev/null || true
pkill -f "npm run dev:client" 2>/dev/null || true
pkill -f "npm run build" 2>/dev/null || true
pkill -f "npm run start" 2>/dev/null || true

# Kill Playwright processes and close ONLY Playwright browser windows
echo "🎭 Killing Playwright processes and closing Playwright browser windows..."
pkill -f "playwright" 2>/dev/null || true

# Use Playwright's own cleanup if available
echo "🧹 Running Playwright cleanup..."
npx playwright install --force 2>/dev/null || true

# Only kill Chrome/Chromium instances with Playwright-specific flags
echo "🌐 Closing Playwright-specific browser instances..."
pkill -f "chrome.*remote-debugging-port" 2>/dev/null || true
pkill -f "chromium.*remote-debugging-port" 2>/dev/null || true
pkill -f "chrome.*--test-type" 2>/dev/null || true
pkill -f "chromium.*--test-type" 2>/dev/null || true
pkill -f "chrome.*--disable-web-security" 2>/dev/null || true
pkill -f "chromium.*--disable-web-security" 2>/dev/null || true
pkill -f "chrome.*--disable-features" 2>/dev/null || true
pkill -f "chromium.*--disable-features" 2>/dev/null || true

# Only close browser windows that are Playwright test windows (surgical approach)
echo "🔍 Closing Playwright test windows only (preserving personal browsers)..."
osascript -e 'tell application "Google Chrome" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Chromium" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Safari" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or name contains "Playwright" or name contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Firefox" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true

# Clean up Playwright profile directory
echo "🧹 Cleaning up Playwright profile..."
rm -rf /tmp/playwright-chrome-profile 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

echo "✅ All development processes killed"
echo "🧹 Clean slate ready for fresh start"
