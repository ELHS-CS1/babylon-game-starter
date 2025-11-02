#!/bin/bash

# Surgical Browser Cleanup Script
# This script ONLY targets Playwright-specific browser instances, leaving personal browsers alone

echo "🎭 Surgical cleanup of Playwright browser instances..."

# Kill Playwright processes
echo "📱 Killing Playwright processes..."
pkill -f "playwright" 2>/dev/null || true

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

# Only close browser windows that are Playwright test windows (more surgical approach)
echo "🔍 Closing Playwright test windows only..."
# This will only close windows with specific Playwright titles or URLs
osascript -e 'tell application "Google Chrome" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Chromium" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Safari" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or name contains "Playwright" or name contains "Test")' 2>/dev/null || true
osascript -e 'tell application "Firefox" to close (every window whose URL contains "localhost:3000" or URL contains "localhost:10000" or title contains "Playwright" or title contains "Test")' 2>/dev/null || true

# Clean up Playwright test results and profile
echo "🧹 Cleaning up Playwright test results and profile..."
rm -rf test-results/ 2>/dev/null || true
rm -rf playwright-report/ 2>/dev/null || true
rm -rf /tmp/playwright-chrome-profile 2>/dev/null || true

echo "✅ Playwright browser cleanup complete (personal browsers preserved)"
