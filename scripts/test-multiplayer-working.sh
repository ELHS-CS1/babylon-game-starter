#!/bin/bash

echo "🚀 TESTING MULTIPLAYER SYSTEM - THE SACRED COMMANDMENTS!"
echo "=================================================="

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "vite\|node.*test-server" 2>/dev/null || true
sleep 2

# Start SSE server
echo "📡 Starting SSE server on port 10000..."
node scripts/test-server.js &
SERVER_PID=$!
echo "SSE Server PID: $SERVER_PID"

# Wait for server to be ready
echo "⏳ Waiting for SSE server to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:10000/api/health >/dev/null 2>&1; then
        echo "✅ SSE server is ready!"
        break
    fi
    echo "Waiting... ($i/10)"
    sleep 1
done

# Start client
echo "🎮 Starting client on port 3003..."
npm run dev:client &
CLIENT_PID=$!
echo "Client PID: $CLIENT_PID"

# Wait for client to be ready
echo "⏳ Waiting for client to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:3003 >/dev/null 2>&1; then
        echo "✅ Client is ready!"
        break
    fi
    echo "Waiting... ($i/15)"
    sleep 1
done

# Test SSE connection
echo "🔗 Testing SSE connection..."
curl -N http://localhost:10000/api/datastar/sse &
SSE_PID=$!
sleep 3
kill $SSE_PID 2>/dev/null || true

# Test peer update
echo "👥 Testing peer update..."
curl -X POST http://localhost:10000/api/datastar/send \
  -H "Content-Type: application/json" \
  -d '{"type":"peer-update","peer":{"id":"test-player-1","name":"Test Player 1","position":{"x":10,"y":0,"z":5},"environment":"levelTest"}}' \
  && echo ""

# Test health endpoint
echo "❤️ Testing health endpoint..."
curl -s http://localhost:10000/api/health | jq . 2>/dev/null || curl -s http://localhost:10000/api/health

echo ""
echo "🎯 MULTIPLAYER TESTING URLS:"
echo "=========================="
echo "🌐 Client Game: http://localhost:3003"
echo "📡 SSE Server: http://localhost:10000/api/health"
echo "📤 Send Endpoint: http://localhost:10000/api/datastar/send"
echo "📡 SSE Endpoint: http://localhost:10000/api/datastar/sse"
echo ""
echo "🧪 TESTING INSTRUCTIONS:"
echo "======================="
echo "1. Open TWO browser tabs to: http://localhost:3003"
echo "2. Click 'Join Game' in both tabs"
echo "3. Move with WASD in one tab - watch the other tab for real-time movement"
echo "4. Change environments - both tabs should sync"
echo "5. Test peer disconnection - close one tab, reopen, should reconnect"
echo ""
echo "🔍 VERIFICATION:"
echo "==============="
echo "- Open browser dev tools → Network tab"
echo "- Look for SSE connection to localhost:10000/api/datastar/sse"
echo "- Watch for real-time peer updates in the console"
echo "- Verify DataStar signals working"
echo ""
echo "⏰ Test will run for 60 seconds, then cleanup..."
echo ""

# Run for 60 seconds then cleanup
sleep 60

echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
kill $CLIENT_PID 2>/dev/null || true
pkill -f "vite\|node.*test-server" 2>/dev/null || true

echo "✅ Multiplayer test completed!"
