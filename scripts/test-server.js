#!/usr/bin/env node

/**
 * DataStar SSE Server - PROPER IMPLEMENTATION!
 * Following the official DataStar patterns from the example
 */

import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

// DataStar SSE connection handler using proper DataStar patterns
function handleSSEConnection(req, res) {
  console.log('🔗 New SSE connection received!');
  console.log(`📊 Total connections: ${sseConnections.size + 1}`);
  
  // Use DataStar's ServerSentEventGenerator for proper SSE
  ServerSentEventGenerator.stream(req, res, (stream) => {
    // Add new connection to the set
    sseConnections.add(stream);
    console.log(`✅ SSE connection added! Total: ${sseConnections.size}`);
    
    // Send initial connection status via DataStar signals
    const signals = { 
      isConnected: true,
      serverTime: new Date().toISOString(),
      connections: sseConnections.size
    };
    console.log(`📡 Sending initial signals: ${JSON.stringify(signals)}`);
    stream.patchSignals(JSON.stringify(signals));

    // Send DataStar patch-elements for DOM updates
    console.log('📡 Sending initial elements...');
    stream.patchElements('<div id="connection-status">Connected</div>');
    stream.patchElements(`<div id="server-time">${new Date().toISOString()}</div>`);

    // Send periodic DataStar SSE heartbeat
    const heartbeat = setInterval(() => {
      if (sseConnections.has(stream)) {
        const heartbeatData = { 
          heartbeat: new Date().toISOString(),
          connections: sseConnections.size
        };
        stream.patchSignals(JSON.stringify(heartbeatData));
        stream.patchElements(`<div id="heartbeat">${new Date().toISOString()}</div>`);
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      sseConnections.delete(stream);
      clearInterval(heartbeat);
      console.log(`🔌 SSE connection closed. Total: ${sseConnections.size}`);
    });

    req.on('error', () => {
      sseConnections.delete(stream);
      clearInterval(heartbeat);
      console.log(`❌ SSE connection error. Total: ${sseConnections.size}`);
    });
  });
}

// Broadcast DataStar SSE using proper DataStar methods
function broadcastToSSE(data) {
  console.log(`📡 Broadcasting to ${sseConnections.size} SSE connections:`, data);
  sseConnections.forEach(stream => {
    try {
      if (data.type === 'peerUpdate' && data.peer) {
        console.log(`📡 Sending peer update for: ${data.peer.name}`);
        // Send peer update via DataStar signals
        stream.patchSignals(JSON.stringify({ 
          peerUpdate: data.peer,
          connections: sseConnections.size
        }));
        // Send peer element via DataStar patch-elements
        stream.patchElements(`<div id="peer-${data.peer.id}">${data.peer.name} - ${data.peer.environment}</div>`);
      } else if (data.type === 'connected') {
        console.log('📡 Sending connection status update');
        stream.patchSignals(JSON.stringify({ isConnected: true }));
        stream.patchElements('<div id="connection-status">Connected</div>');
      } else {
        console.log(`📡 Sending general broadcast: ${JSON.stringify(data)}`);
        stream.patchSignals(JSON.stringify({ broadcast: data }));
        stream.patchElements(`<div id="broadcast">${JSON.stringify(data)}</div>`);
      }
    } catch (error) {
      console.log(`❌ Error broadcasting to stream: ${error}`);
      sseConnections.delete(stream);
    }
  });
}

// Health check handler
function handleHealthCheck(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'healthy', connections: sseConnections.size, timestamp: Date.now() }));
}

// DataStar send handler
function handleDataStarSend(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
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
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
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
  console.log(`🚀 DataStar SSE Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: ${protocol}://localhost:${PORT}/api/datastar/sse`);
  console.log(`📤 Send endpoint: ${protocol}://localhost:${PORT}/api/datastar/send`);
  console.log(`❤️ Health check: ${protocol}://localhost:${PORT}/api/health`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('Server gracefully shut down.');
    process.exit(0);
  });
});