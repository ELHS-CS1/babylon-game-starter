#!/usr/bin/env node

/**
 * Minimal SSE Test Server
 * Tests fundamental SSE functionality for multiplayer updates
 * Following the Ten Commandments: ESM, DataStar SSE, No Console Logs
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const PORT = 10000;
const sseConnections = new Set();

// SSE connection handler
function handleSSEConnection(req, res) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization'
  });

  // Send initial connection event after a small delay to ensure EventSource is ready
  setTimeout(() => {
    res.write('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n');
  }, 100);

  // Store connection
  sseConnections.add(res);

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    if (sseConnections.has(res)) {
      res.write('data: {"type":"heartbeat","timestamp":' + Date.now() + '}\n\n');
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    sseConnections.delete(res);
    clearInterval(heartbeat);
  });

  req.on('error', () => {
    sseConnections.delete(res);
    clearInterval(heartbeat);
  });
}

// Broadcast to all SSE connections
function broadcastToSSE(data) {
  const message = 'data: ' + JSON.stringify(data) + '\n\n';
  sseConnections.forEach(res => {
    try {
      res.write(message);
    } catch {
      sseConnections.delete(res);
    }
  });
}

// Handle DataStar send requests
function handleDataStarSend(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += String(chunk);
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data === null || data === undefined || typeof data !== 'object') {
        return;
      }
      
      // Broadcast the message to all SSE connections
      broadcastToSSE({
        type: 'message',
        data: data,
        timestamp: Date.now()
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Create HTTP server
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      connections: sseConnections.size,
      timestamp: Date.now()
    }));
    return;
  }
  
  // SSE endpoint for DataStar
  if (url.pathname === '/api/datastar/sse') {
    handleSSEConnection(req, res);
    return;
  }
  
  // DataStar send endpoint
  if (url.pathname === '/api/datastar/send') {
    handleDataStarSend(req, res);
    return;
  }
  
  // Default response
  res.writeHead(404);
  res.end('Not Found');
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SSE Test Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/datastar/sse`);
  console.log(`📤 Send endpoint: http://localhost:${PORT}/api/datastar/send`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
