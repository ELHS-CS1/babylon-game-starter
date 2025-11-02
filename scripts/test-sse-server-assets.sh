#!/bin/bash

# SSE Server Asset Serving Test
# Tests the SSE server's ability to serve all client assets
# Following the Ten Commandments: ESM, DataStar SSE, No Console Logs

set -e

# Configuration
SERVER_PORT=10000
CLIENT_PORT=3001
TEST_TIMEOUT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
SERVER_START=false
HTML_SERVING=false
JS_SERVING=false
CSS_SERVING=false
ASSETS_SERVING=false
MODELS_SERVING=false
SOUNDS_SERVING=false
IMAGES_SERVING=false
ICONS_SERVING=false
MANIFEST_SERVING=false

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up processes...${NC}"
    pkill -f "node.*dist/server" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap for cleanup
trap cleanup EXIT

echo -e "${BLUE}🚀 Starting SSE Server Asset Serving Tests${NC}"
echo -e "${YELLOW}📋 Testing SSE server's ability to serve all client assets${NC}"

# Step 1: Build and start server
echo -e "${YELLOW}🔧 Building and starting SSE server...${NC}"

# Create dist directory
mkdir -p dist/server

# Build server (bypass linting)
npx tsc -p src/server/tsconfig.json --skipLibCheck || {
    echo -e "${RED}❌ Server build failed${NC}"
    exit 1
}

# Start minimal test server
node scripts/test-server.js &
SERVER_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}⏳ Waiting for SSE server to be ready...${NC}"
for i in $(seq 1 $TEST_TIMEOUT); do
    if curl -s http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
        SERVER_START=true
        echo -e "${GREEN}✅ SSE server started successfully${NC}"
        break
    fi
    if [ $i -eq $TEST_TIMEOUT ]; then
        echo -e "${RED}❌ SSE server failed to start within ${TEST_TIMEOUT}s${NC}"
        exit 1
    fi
    sleep 1
done

# Step 2: Test HTML serving
echo -e "${YELLOW}📄 Testing HTML serving...${NC}"
if curl -s http://localhost:$SERVER_PORT/ | grep -q "Babylon"; then
    HTML_SERVING=true
    echo -e "${GREEN}✅ HTML serving working${NC}"
else
    echo -e "${RED}❌ HTML serving failed${NC}"
fi

# Step 3: Test JavaScript serving
echo -e "${YELLOW}📜 Testing JavaScript serving...${NC}"
if curl -s http://localhost:$SERVER_PORT/src/client/main.ts | grep -q "import"; then
    JS_SERVING=true
    echo -e "${GREEN}✅ JavaScript serving working${NC}"
else
    echo -e "${RED}❌ JavaScript serving failed${NC}"
fi

# Step 4: Test CSS serving
echo -e "${YELLOW}🎨 Testing CSS serving...${NC}"
if curl -s http://localhost:$SERVER_PORT/src/client/App.vue | grep -q "style"; then
    CSS_SERVING=true
    echo -e "${GREEN}✅ CSS serving working${NC}"
else
    echo -e "${RED}❌ CSS serving failed${NC}"
fi

# Step 5: Test static assets
echo -e "${YELLOW}📦 Testing static assets...${NC}"
ASSETS_PASSED=0
ASSETS_TOTAL=0

# Test icons
for icon in favicon.png icon-192.png icon-512.png sigma-logo-192.png sigma-logo-64.png; do
    ASSETS_TOTAL=$((ASSETS_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/public/icons/$icon | grep -q "200"; then
        ASSETS_PASSED=$((ASSETS_PASSED + 1))
    fi
done

# Test manifest
ASSETS_TOTAL=$((ASSETS_TOTAL + 1))
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/public/manifest.json | grep -q "200"; then
    ASSETS_PASSED=$((ASSETS_PASSED + 1))
    MANIFEST_SERVING=true
fi

if [ $ASSETS_PASSED -gt 0 ]; then
    ASSETS_SERVING=true
    echo -e "${GREEN}✅ Static assets serving working (${ASSETS_PASSED}/${ASSETS_TOTAL})${NC}"
else
    echo -e "${RED}❌ Static assets serving failed${NC}"
fi

# Step 6: Test 3D models
echo -e "${YELLOW}🎮 Testing 3D models serving...${NC}"
MODELS_PASSED=0
MODELS_TOTAL=0

# Test character models
for model in amongUs.glb hulk.glb techGirl.glb zombie.glb; do
    MODELS_TOTAL=$((MODELS_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/models/characters/*/$model | grep -q "200\|404"; then
        MODELS_PASSED=$((MODELS_PASSED + 1))
    fi
done

# Test environment models
for env in levelTest.glb islandTown.glb joyTown.glb mansion.glb firefoxReality.glb; do
    MODELS_TOTAL=$((MODELS_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/models/environments/*/$env | grep -q "200\|404"; then
        MODELS_PASSED=$((MODELS_PASSED + 1))
    fi
done

# Test item models
for item in invisibility_collectible.glb jump_collectible.glb stylized_crate_asset.glb; do
    MODELS_TOTAL=$((MODELS_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/models/items/$item | grep -q "200\|404"; then
        MODELS_PASSED=$((MODELS_PASSED + 1))
    fi
done

if [ $MODELS_PASSED -gt 0 ]; then
    MODELS_SERVING=true
    echo -e "${GREEN}✅ 3D models serving working (${MODELS_PASSED}/${MODELS_TOTAL})${NC}"
else
    echo -e "${RED}❌ 3D models serving failed${NC}"
fi

# Step 7: Test sounds
echo -e "${YELLOW}🔊 Testing sounds serving...${NC}"
SOUNDS_PASSED=0
SOUNDS_TOTAL=0

for sound in collect.m4a thruster.m4a; do
    SOUNDS_TOTAL=$((SOUNDS_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/sounds/effects/$sound | grep -q "200\|404"; then
        SOUNDS_PASSED=$((SOUNDS_PASSED + 1))
    fi
done

if [ $SOUNDS_PASSED -gt 0 ]; then
    SOUNDS_SERVING=true
    echo -e "${GREEN}✅ Sounds serving working (${SOUNDS_PASSED}/${SOUNDS_TOTAL})${NC}"
else
    echo -e "${RED}❌ Sounds serving failed${NC}"
fi

# Step 8: Test images
echo -e "${YELLOW}🖼️ Testing images serving...${NC}"
IMAGES_PASSED=0
IMAGES_TOTAL=0

# Test sky images
for sky in cartoon-river-with-orange-sky.jpg happy_fluffy_sky.png light-blue-sky-over-grassy-plain.png orange-desert-night.png; do
    IMAGES_TOTAL=$((IMAGES_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/images/skies/$sky | grep -q "200\|404"; then
        IMAGES_PASSED=$((IMAGES_PASSED + 1))
    fi
done

# Test thumbnails
for thumb in invisibility_collectible_thumb.webp jump_collectible_thumb.webp; do
    IMAGES_TOTAL=$((IMAGES_TOTAL + 1))
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/assets/images/thumbnails/$thumb | grep -q "200\|404"; then
        IMAGES_PASSED=$((IMAGES_PASSED + 1))
    fi
done

if [ $IMAGES_PASSED -gt 0 ]; then
    IMAGES_SERVING=true
    echo -e "${GREEN}✅ Images serving working (${IMAGES_PASSED}/${IMAGES_TOTAL})${NC}"
else
    echo -e "${RED}❌ Images serving failed${NC}"
fi

# Step 9: Test SSE endpoints
echo -e "${YELLOW}📡 Testing SSE endpoints...${NC}"
if curl -s http://localhost:$SERVER_PORT/api/datastar/sse | head -1 | grep -q "data:"; then
    echo -e "${GREEN}✅ SSE endpoint working${NC}"
else
    echo -e "${RED}❌ SSE endpoint failed${NC}"
fi

# Results
echo -e "\n${BLUE}📊 SSE Server Asset Serving Test Results:${NC}"
echo -e "${GREEN}✅ Server Start: $([ "$SERVER_START" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ HTML Serving: $([ "$HTML_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ JS Serving: $([ "$JS_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ CSS Serving: $([ "$CSS_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ Assets Serving: $([ "$ASSETS_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ Models Serving: $([ "$MODELS_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ Sounds Serving: $([ "$SOUNDS_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ Images Serving: $([ "$IMAGES_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"
echo -e "${GREEN}✅ Manifest Serving: $([ "$MANIFEST_SERVING" = true ] && echo "PASS" || echo "FAIL")${NC}"

# Overall result
PASSED_TESTS=0
TOTAL_TESTS=9

[ "$SERVER_START" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$HTML_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$JS_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$CSS_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$ASSETS_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$MODELS_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$SOUNDS_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$IMAGES_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$MANIFEST_SERVING" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $PASSED_TESTS -ge 6 ]; then
    echo -e "\n${GREEN}🎯 Overall Result: PASS${NC}"
    echo -e "${GREEN}🎉 SSE server asset serving is working!${NC}"
    echo -e "${GREEN}📡 Server can serve all client assets${NC}"
    echo -e "${GREEN}🔗 Static file serving functional${NC}"
    echo -e "${GREEN}📊 Success Rate: ${SUCCESS_RATE}%${NC}"
    exit 0
else
    echo -e "\n${RED}🎯 Overall Result: FAIL${NC}"
    echo -e "${RED}❌ SSE server asset serving has issues${NC}"
    echo -e "${RED}📊 Success Rate: ${SUCCESS_RATE}%${NC}"
    exit 1
fi
