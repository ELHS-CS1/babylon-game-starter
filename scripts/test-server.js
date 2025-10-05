#!/usr/bin/env node

/**
 * Minimal SSE Test Server
 * Tests fundamental SSE functionality for multiplayer updates
 * Following the Ten Commandments: ESM, DataStar SSE, No Console Logs
 */

import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const PORT = 10000;
const sseConnections = new Set();

// Use mkcert certificates for HTTPS
function getMkcertCert() {
  const keyPath = join(process.cwd(), 'certs', 'localhost+2-key.pem');
  const certPath = join(process.cwd(), 'certs', 'localhost+2.pem');
  
  if (!existsSync(keyPath) || !existsSync(certPath)) {
    console.error('Mkcert certificates not found. Run: cd certs && mkcert localhost 127.0.0.1 ::1');
    return null;
  }
  
  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath)
  };
}

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

  // Send DataStar SSE patch-elements event for connection status
  setTimeout(() => {
    res.write('event: datastar-patch-elements\n');
    res.write('data: elements <div id="connection-status">Connected</div>\n');
    res.write('data: elements <div id="server-time">' + new Date().toISOString() + '</div>\n\n');
  }, 100);

  // Store connection
  sseConnections.add(res);

  // Send periodic DataStar SSE heartbeat
  const heartbeat = setInterval(() => {
    if (sseConnections.has(res)) {
      res.write('event: datastar-patch-elements\n');
      res.write('data: elements <div id="heartbeat">' + new Date().toISOString() + '</div>\n\n');
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

// Broadcast DataStar SSE patch-elements to all connections
function broadcastToSSE(data) {
  // Convert data to DataStar SSE patch-elements format
  let htmlElements = '';
  
  if (data.type === 'peerUpdate' && data.peer) {
    htmlElements = `<div id="peer-${data.peer.id}">${data.peer.name} - ${data.peer.environment}</div>`;
  } else if (data.type === 'connected') {
    htmlElements = `<div id="connection-status">Connected</div>`;
  } else {
    htmlElements = `<div id="broadcast">${JSON.stringify(data)}</div>`;
  }
  
  const message = 'event: datastar-patch-elements\n' +
                 'data: elements ' + htmlElements + '\n\n';
                 
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

// Create HTTPS server
const sslOptions = getMkcertCert();
const server = sslOptions ? createServer(sslOptions, async (req, res) => {
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
}) : createHttpServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Route handling
  if (url.pathname === '/api/health') {
    handleHealthCheck(req, res);
  } else if (url.pathname === '/api/datastar/sse') {
    handleSSEConnection(req, res);
  } else if (url.pathname === '/api/datastar/send') {
    handleDataStarSend(req, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
server.listen(PORT, () => {
  const protocol = sslOptions ? 'https' : 'http';
  console.log(`🚀 SSE Test Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: ${protocol}://localhost:${PORT}/api/datastar/sse`);
  console.log(`📤 Send endpoint: ${protocol}://localhost:${PORT}/api/datastar/send`);
  console.log(`❤️ Health check: ${protocol}://localhost:${PORT}/api/health`);
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
