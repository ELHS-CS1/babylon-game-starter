#!/usr/bin/env node

/**
 * DataStar SSE Server
 * Uses DataStar's ServerSentEventGenerator for proper SSE signaling
 * Following the Ten Commandments: ESM, DataStar SSE, No Console Logs
 */

import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { ServerSentEventGenerator } from '@starfederation/datastar-sdk';

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

// DataStar SSE connection handler using ServerSentEventGenerator
function handleSSEConnection(req, res) {
  // Use DataStar's ServerSentEventGenerator for proper SSE
  ServerSentEventGenerator.stream(req, res, (stream) => {
    // Add new connection to the set
    sseConnections.add(stream);
    
    // Send initial connection status via DataStar signals (as string)
    stream.patchSignals(JSON.stringify({ 
      isConnected: true,
      serverTime: new Date().toISOString(),
      connections: sseConnections.size
    }));

    // Send DataStar patch-elements for DOM updates
    stream.patchElements('<div id="connection-status">Connected</div>');
    stream.patchElements(`<div id="server-time">${new Date().toISOString()}</div>`);

    // Send periodic DataStar SSE heartbeat
    const heartbeat = setInterval(() => {
      if (sseConnections.has(stream)) {
        stream.patchSignals(JSON.stringify({ 
          heartbeat: new Date().toISOString(),
          connections: sseConnections.size
        }));
        stream.patchElements(`<div id="heartbeat">${new Date().toISOString()}</div>`);
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      sseConnections.delete(stream);
      clearInterval(heartbeat);
    });

    req.on('error', () => {
      sseConnections.delete(stream);
      clearInterval(heartbeat);
    });
  });
}

// Broadcast DataStar SSE using ServerSentEventGenerator methods
function broadcastToSSE(data) {
  sseConnections.forEach(stream => {
    try {
      if (data.type === 'peerUpdate' && data.peer) {
        // Send peer update via DataStar signals
        stream.patchSignals(JSON.stringify({ 
          peerUpdate: data.peer,
          connections: sseConnections.size
        }));
        // Send peer element via DataStar patch-elements
        stream.patchElements(`<div id="peer-${data.peer.id}">${data.peer.name} - ${data.peer.environment}</div>`);
      } else if (data.type === 'connected') {
        stream.patchSignals(JSON.stringify({ isConnected: true }));
        stream.patchElements('<div id="connection-status">Connected</div>');
      } else {
        stream.patchSignals(JSON.stringify({ broadcast: data }));
        stream.patchElements(`<div id="broadcast">${JSON.stringify(data)}</div>`);
      }
    } catch {
      sseConnections.delete(stream);
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
      
      // Handle different message types
      if (data.type === 'peer-update' && data.peer) {
        // Broadcast peer update to all SSE connections
        broadcastToSSE({
          type: 'peerUpdate',
          peer: data.peer,
          timestamp: Date.now()
        });
      } else {
        // Broadcast general message to all SSE connections
        broadcastToSSE({
          type: 'message',
          data: data,
          timestamp: Date.now()
        });
      }
      
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
