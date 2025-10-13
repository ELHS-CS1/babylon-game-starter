// ============================================================================
// MAIN SERVER - Modularized server with clean separation of concerns
// ============================================================================

import type { IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpServer } from 'http';
import { join } from 'path';
import config, { logConfig } from './config.js';
import { GDCReportCollector } from './reports/GDCReportCollector.js';
import { GDCReportManager } from './reports/GDCReportManager.js';
import { GDCReportAPI } from './reports/GDCReportAPI.js';
import { pushNotificationService } from './services/PushNotificationService.js';
import { PeerDataManager } from './modules/PeerDataManager.js';
import { SSEManager } from './modules/SSEManager.js';
import { StaticFileServer } from './modules/StaticFileServer.js';
import { BroadcastScheduler } from './modules/BroadcastScheduler.js';

// Initialize modules
const peerDataManager = new PeerDataManager();
const sseManager = new SSEManager(peerDataManager, config.corsOrigin);
const staticFileServer = new StaticFileServer(config.clientPath);
const broadcastScheduler = new BroadcastScheduler(peerDataManager, sseManager);
broadcastScheduler.start();
console.log('✅ BroadcastScheduler started - broadcasting every 150ms');

// Initialize GDC reporting system
const reportCollector = new GDCReportCollector();
const reportManager = new GDCReportManager({
  reportsDirectory: join(process.cwd(), 'GDC', 'reports'),
  maxReports: 100,
  maxAgeDays: 30
});
const reportAPI = new GDCReportAPI(reportManager, reportCollector);

// API request handler
async function handleApiRequest(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  // Handle DataStar send endpoint
  if (url.pathname === '/api/datastar/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📤 Received DataStar send request:', data);
        
        // Handle different request types
        if (data.type === 'requestPeers' && data.environment) {
          handlePeerRequest(res, data.environment);
        } else if (data.type === 'join' && data.playerName) {
          handleJoinRequest(res, data);
        } else if (data.type === 'positionUpdate') {
          handlePositionUpdate(req, res, data);
        } else if (data.type === 'peerDataUpdate') {
          handlePeerDataUpdate(req, res, data);
        } else if (data.type === 'environmentChange') {
          handleEnvironmentChange(req, res, data);
        } else if (data.type === 'characterModelChange') {
          handleCharacterModelChange(req, res, data);
        } else if (data.type === 'peer-update') {
          handlePeerUpdate(req, res, data);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unknown request type' }));
        }
      } catch (error) {
        console.error('❌ Error handling request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  // Handle GDC reports API
  if (url.pathname.startsWith('/api/gdc/')) {
    await reportAPI.handleRequest(req, res);
    return;
  }
  
  // Handle push notification API
  if (url.pathname === '/api/push/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        JSON.parse(body); // Parse subscription data
        // pushNotificationService.addSubscription(subscription);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Error handling push subscription:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid subscription' }));
      }
    });
    return;
  }
  
  // Handle push notification public key request
  if (url.pathname === '/api/push/public-key' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      publicKey: pushNotificationService.getPublicKey() 
    }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// Helper functions for API handlers
function handlePeerRequest(res: ServerResponse, environment: string): void {
  const environmentPeers = peerDataManager.getPeersByEnvironment(environment);
  const response = {
    type: 'peersResponse',
    environment,
    peers: environmentPeers,
    timestamp: Date.now()
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

function handleJoinRequest(res: ServerResponse, data: any): void {
  const newPlayer = peerDataManager.addPeer(data.playerName, data.peerId, data.character, data.environment || 'levelTest');
  
  // Associate the SSE connection with the peer ID (not the HTTP response)
  const associated = sseManager.associateConnectionWithPeer(newPlayer.id);
  if (!associated) {
    console.log(`⚠️ Failed to associate SSE connection for peer: ${newPlayer.id}`);
  }
  
  const existingPeers = peerDataManager.getPeersByEnvironment(newPlayer.environment)
    .filter(peer => peer.id !== newPlayer.id);
  
  const response = {
    type: 'joinResponse',
    success: true,
    player: newPlayer,
    existingPeers,
    gameState: {
      peers: peerDataManager.getPeersByEnvironment(newPlayer.environment).length,
      environment: newPlayer.environment
    },
    timestamp: Date.now()
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
  
  // Broadcast to others
  const peerUpdateMessage = {
    type: 'peerUpdate',
    peer: newPlayer,
    gameState: {
      peers: peerDataManager.getPeersByEnvironment(newPlayer.environment).length,
      environment: newPlayer.environment
    }
  };
  sseManager.broadcastToEnvironment(newPlayer.environment, peerUpdateMessage);
}

function handlePositionUpdate(_req: IncomingMessage, res: ServerResponse, data: any): void {
  const peerId = peerDataManager.getPeerIdFromConnection(res);
  
  if (peerId && peerDataManager.updatePeerPosition(
    peerId,
    data.position,
    data.rotation,
    data.boostActive,
    data.state
  )) {
    const peer = peerDataManager.getPeer(peerId);
    if (peer) {
      sseManager.broadcastToEnvironment(peer.environment, {
        type: 'peerUpdate',
        peer
      });
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}

function handlePeerDataUpdate(_req: IncomingMessage, res: ServerResponse, data: any): void {
  // Handle differential peer data updates from LocalPeerDataServiceProvider
  const peerId = data.data?.id;
  
  if (peerId) {
    peerDataManager.updatePeerPosition(
      peerId,
      data.data.position,
      data.data.rotation,
      data.data.boostActive,
      data.data.state
    );
    
    const peer = peerDataManager.getPeer(peerId);
    if (peer) {
      sseManager.broadcastToEnvironment(peer.environment, {
        type: 'peerUpdate',
        peer: data.data  // Send only changed fields
      });
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}

function handleEnvironmentChange(_req: IncomingMessage, res: ServerResponse, data: any): void {
  console.log('🌍 Received environment change:', data);
  
  // Update peer's environment in the database
  if (data.peerId) {
    const peer = peerDataManager.getPeer(data.peerId);
    if (peer) {
      peer.environment = data.environment;
      peer.lastUpdate = Date.now();
      console.log(`📍 Updated peer ${data.peerId} environment to: ${data.environment}`);
      
      // Broadcast environment change to other peers
      sseManager.broadcastToEnvironment(data.environment, {
        type: 'peerUpdate',
        peer: peer
      });
    } else {
      console.log(`📍 Peer ${data.peerId} not found for environment change`);
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Environment change processed' }));
}

function handleCharacterModelChange(_req: IncomingMessage, res: ServerResponse, data: any): void {
  console.log('👤 Received character model change:', data);
  
  // Update peer's character in the database
  if (data.peerId) {
    const peer = peerDataManager.getPeer(data.peerId);
    if (peer) {
      peer.character = data.character;
      peer.lastUpdate = Date.now();
      console.log(`📍 Updated peer ${data.peerId} character to: ${data.character}`);
      
      // Broadcast character change to other peers in the same environment
      sseManager.broadcastToEnvironment(peer.environment, {
        type: 'peerUpdate',
        peer: peer
      });
    } else {
      console.log(`📍 Peer ${data.peerId} not found for character change`);
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Character model change processed' }));
}

function handlePeerUpdate(_req: IncomingMessage, res: ServerResponse, data: any): void {
  console.log('👥 Received peer update:', data);
  
  // Just acknowledge the peer update
  // The client handles its own peer state management
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Peer update acknowledged' }));
}

// Create HTTP server
const server = createHttpServer(async (req, res) => {
  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const url = new URL(req.url ?? '/', `http://${host ?? 'localhost'}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (url.pathname === config.healthCheckPath) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      peers: peerDataManager.getPeerCount(),
      connections: sseManager.getConnectionCount(),
      environments: peerDataManager.getGameState().environments,
      protocol: 'http',
      config: {
        isProduction: config.isProduction,
        isDocker: config.isDocker,
        port: config.port
      }
    }));
    return;
  }
  
  // API endpoints
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/datastar/sse') {
      sseManager.handleSSEConnection(req, res);
      return;
    }
    await handleApiRequest(req, res, url);
      return;
    }
    
  // Static file serving
  if (url.pathname === '/sw.js') {
    staticFileServer.handleServiceWorker(req, res);
              return;
            }

  if (url.pathname === '/manifest.json') {
    staticFileServer.handleManifest(req, res);
              return;
            }
    
  if (url.pathname === '/favicon.ico' || url.pathname === '/icons/favicon.png') {
    staticFileServer.handleFavicon(req, res);
    return;
  }
  
  if (url.pathname.startsWith('/icons/')) {
    staticFileServer.handleIcon(req, res, url.pathname);
    return;
  }
  
  if (url.pathname.startsWith('/assets/')) {
    staticFileServer.handleAsset(req, res, url.pathname);
      return;
  }
  
  // Serve index.html for root path and client-side routing
  if (url.pathname === '/' || !url.pathname.includes('.')) {
    staticFileServer.handleIndex(req, res);
      return;
  }
  
  staticFileServer.handleStaticFile(req, res, url.pathname);
});

// Add graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  broadcastScheduler.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  broadcastScheduler.stop();
    process.exit(0);
  });

// Start server
server.listen(config.port, () => {
  logConfig();
  console.log(`✅ Server running on port ${config.port}`);
});