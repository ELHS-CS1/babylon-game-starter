import type { IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer } from 'https';
import { join } from 'path';
import { readFileSync } from 'fs';
import config, { logConfig } from './config.js';
import { GDCReportCollector } from './reports/GDCReportCollector.js';
import { GDCReportManager } from './reports/GDCReportManager.js';
import { GDCReportAPI } from './reports/GDCReportAPI.js';
import { pushNotificationService } from './services/PushNotificationService.js';

// Note: __dirname is not used in this file as we use config paths

// Types for our game state
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Peer {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  environment: string;
  lastUpdate: number;
}

// Type guard functions for safe data validation
function isVector3(obj: unknown): obj is Vector3 {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  if (!('x' in obj) || !('y' in obj) || !('z' in obj)) {
    return false;
  }
  
  const xValue = obj['x'];
  const yValue = obj['y'];
  const zValue = obj['z'];
  
  return typeof xValue === 'number' && typeof yValue === 'number' && typeof zValue === 'number';
}

function isPeer(obj: unknown): obj is Peer {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  return 'id' in obj && typeof obj['id'] === 'string' &&
         'name' in obj && typeof obj['name'] === 'string' &&
         'position' in obj && isVector3(obj['position']) &&
         'rotation' in obj && isVector3(obj['rotation']) &&
         'environment' in obj && typeof obj['environment'] === 'string' &&
         'lastUpdate' in obj && typeof obj['lastUpdate'] === 'number';
}

function getPeerSafely(peers: Record<string, Peer>, id: string): Peer | undefined {
  const peer = peers[id];
  if (peer && isPeer(peer)) {
    return peer;
  }
  return undefined;
}


interface GameState {
  peers: Record<string, Peer>;
  environments: string[];
  currentEnvironment: string;
}

// Initialize game state
const gameState: GameState = {
  peers: {},
  environments: ['levelTest', 'islandTown', 'joyTown', 'mansion', 'firefoxReality'],
  currentEnvironment: 'levelTest'
};

// Store SSE connections for DataStar
const sseConnections = new Set<ServerResponse>();

// SSE connection handler for DataStar
function handleSSEConnection(req: IncomingMessage, res: ServerResponse): void {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization'
  });

  // Send initial connection event
  res.write('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n');

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
function broadcastToSSE(data: unknown): void {
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
function handleDataStarSend(req: IncomingMessage, res: ServerResponse): void {
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
      const data: unknown = JSON.parse(body);
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

// Initialize GDC reporting system
const reportCollector = new GDCReportCollector();
const reportManager = new GDCReportManager({
  reportsDirectory: join(process.cwd(), 'GDC', 'reports'),
  maxReports: 100,
  maxAgeDays: 30
});
const reportAPI = new GDCReportAPI(reportManager, reportCollector);

// Serve static files
const serveStatic = (_req: IncomingMessage, res: ServerResponse, filePath: string, contentType: string) => {
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
};

// HTTPS server for serving client and API with SSE support
const httpsOptions = {
  key: readFileSync('./certs/localhost-key.pem'),
  cert: readFileSync('./certs/localhost.pem')
};

const server = createHttpsServer(httpsOptions, async (req: IncomingMessage, res: ServerResponse) => {
  const hostHeader = req.headers.host;
  const host: string | undefined = Array.isArray(hostHeader) ? 
    (typeof hostHeader[0] === 'string' ? hostHeader[0] : undefined) : 
    hostHeader;
  const url = new URL(req.url ?? '/', `https://${host ?? 'localhost'}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (url.pathname === config.healthCheckPath) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      peers: Object.keys(gameState.peers).length,
      environment: gameState.currentEnvironment,
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
    // Handle SSE endpoint for DataStar
    if (url.pathname === '/api/datastar/sse') {
      handleSSEConnection(req, res);
      return;
    }
    
    // Handle DataStar send endpoint
    if (url.pathname === '/api/datastar/send') {
      handleDataStarSend(req, res);
      return;
    }
    
            // Handle GDC report endpoints
            if (url.pathname.startsWith('/api/reports')) {
              await reportAPI.handleRequest(req, res);
              return;
            }

            // Handle push notification endpoints
            if (url.pathname === '/api/push/subscribe') {
              await pushNotificationService.handleSubscriptionRequest(req, res);
              return;
            }

            if (url.pathname === '/api/push/notify') {
              await pushNotificationService.handleNotificationRequest(req, res);
              return;
            }

            if (url.pathname === '/api/push/vapid-key') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                publicKey: pushNotificationService.getPublicKey() 
              }));
              return;
            }
    
    handleApiRequest(req, res, url);
    return;
  }
  
  // Serve client files
  if (url.pathname === '/' || url.pathname === '/index.html') {
    serveStatic(req, res, join(config.clientPath, 'index.html'), 'text/html');
    return;
  }
  
  // Serve static assets
  const assetPath = join(config.clientPath, url.pathname);
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  const contentType = getContentType(ext);
  
  serveStatic(req, res, assetPath, contentType);
});

function getContentType(ext?: string): string {
  switch (ext) {
    case 'js': return 'application/javascript';
    case 'css': return 'text/css';
    case 'html': return 'text/html';
    case 'json': return 'application/json';
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'woff': return 'font/woff';
    case 'woff2': return 'font/woff2';
    case 'ttf': return 'font/ttf';
    case 'eot': return 'application/vnd.ms-fontobject';
    case undefined: return 'application/octet-stream';
    default: return 'application/octet-stream';
  }
}

function handleApiRequest(req: IncomingMessage, res: ServerResponse, url: URL) {
  res.setHeader('Content-Type', 'application/json');
  
  if (url.pathname === '/api/peers') {
    if (req.method === 'GET') {
      // Return peers in current environment only
      const currentPeers = Object.values(gameState.peers)
        .filter(peer => peer.environment === gameState.currentEnvironment);
      
      // Collect metrics
      reportCollector.incrementRequestCount();
      reportCollector.collectGameMetrics(
        currentPeers.length,
        Object.keys(gameState.peers).length,
        gameState.currentEnvironment
      );
      
      res.writeHead(200);
      res.end(JSON.stringify(currentPeers));
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: unknown) => {
        body += String(chunk);
      });
      
      req.on('end', async () => {
        try {
          const peerData: unknown = JSON.parse(body);
          if (peerData === null || peerData === undefined || typeof peerData !== 'object') {
            return;
          }
          const peerDataObj = peerData as Record<string, unknown>;
          const peer: Peer = {
            id: typeof peerDataObj['id'] === 'string' ? peerDataObj['id'] : '',
            name: typeof peerDataObj['name'] === 'string' ? peerDataObj['name'] : 'Unknown',
            position: isVector3(peerDataObj['position']) ? peerDataObj['position'] : { x: 0, y: 0, z: 0 },
            rotation: isVector3(peerDataObj['rotation']) ? peerDataObj['rotation'] : { x: 0, y: 0, z: 0 },
            environment: gameState.currentEnvironment,
            lastUpdate: Date.now()
          };
          
                  if (peer.id !== '') {
                    const isNewPeer = !gameState.peers[peer.id];
                    gameState.peers[peer.id] = peer;

                    // Collect peer metrics
                    reportCollector.collectPeerMetrics(peer.id, peer as unknown as Record<string, unknown>);
                    reportCollector.collectEnvironmentMetrics(gameState.currentEnvironment,
                      Object.values(gameState.peers).filter(p => p.environment === gameState.currentEnvironment).length);

                    // Broadcast peer update via SSE
                    broadcastToSSE({
                      type: 'peerUpdate',
                      peer: peer,
                      gameState: {
                        peers: Object.keys(gameState.peers).length,
                        environment: gameState.currentEnvironment
                      }
                    });

                    // Send push notification if this is a new peer joining
                    if (isNewPeer) {
                      await pushNotificationService.sendNotificationToAll({
                        title: '🎮 New Player Joined!',
                        body: `${peer.name} joined the game in ${gameState.currentEnvironment}`,
                        icon: '/icons/sigma-logo-192.png',
                        badge: '/icons/sigma-logo-64.png',
                        data: {
                          type: 'player-joined',
                          peerId: peer.id,
                          peerName: peer.name,
                          environment: gameState.currentEnvironment,
                          timestamp: Date.now()
                        },
                        actions: [
                          {
                            action: 'join',
                            title: 'Join Game',
                            icon: '/icons/sigma-logo-192.png'
                          }
                        ]
                      });
                    }
                  }
          
          res.writeHead(201);
          res.end(JSON.stringify(peer));
        } catch {
          reportCollector.incrementErrorCount();
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
  }
  
  if (url.pathname === '/api/environments') {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        environments: gameState.environments,
        current: gameState.currentEnvironment
      }));
      return;
    }
  }
  
          if (url.pathname.startsWith('/api/peer/') && req.method === 'PUT') {
            const peerId = url.pathname.split('/')[3];
            if (peerId === null || peerId === undefined || peerId === '') {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Peer ID is required' }));
              return;
            }
            let body = '';
            
            req.on('data', (chunk: unknown) => {
              body += String(chunk);
            });
            
            req.on('end', () => {
              try {
                const updateData: unknown = JSON.parse(body);
                if (updateData === null || updateData === undefined || typeof updateData !== 'object') {
                  return;
                }
                const updateDataObj = updateData as Record<string, unknown>;
                
                if (peerId !== '' && peerId in gameState.peers) {
                  const existingPeer = getPeerSafely(gameState.peers, peerId);
                  
                  if (!existingPeer) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Peer not found' }));
                    return;
                  }
                  
                  const updatedPeer: Peer = {
                    ...existingPeer,
                    lastUpdate: Date.now()
                  };
                  
                  // Safely update only known properties
                  if (typeof updateDataObj['id'] === 'string') updatedPeer.id = updateDataObj['id'];
                  if (typeof updateDataObj['name'] === 'string') updatedPeer.name = updateDataObj['name'];
                  if (isVector3(updateDataObj['position'])) updatedPeer.position = updateDataObj['position'];
                  if (isVector3(updateDataObj['rotation'])) updatedPeer.rotation = updateDataObj['rotation'];
                  if (typeof updateDataObj['environment'] === 'string') updatedPeer.environment = updateDataObj['environment'];
                  
                  gameState.peers[peerId] = updatedPeer;
                  
                  // Collect peer metrics
                  const peerMetrics: Record<string, unknown> = {
                    id: updatedPeer.id,
                    name: updatedPeer.name,
                    position: updatedPeer.position,
                    rotation: updatedPeer.rotation,
                    environment: updatedPeer.environment,
                    lastUpdate: updatedPeer.lastUpdate
                  };
                  if (peerId) {
                    reportCollector.collectPeerMetrics(peerId, peerMetrics);
                  }
                  
                  res.writeHead(200);
                  res.end(JSON.stringify(updatedPeer));
                } else {
                  res.writeHead(404);
                  res.end(JSON.stringify({ error: 'Peer not found' }));
                }
              } catch {
                reportCollector.incrementErrorCount();
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
          
          if (url.pathname === '/api/logs' && req.method === 'POST') {
            let body = '';
            
            req.on('data', (chunk: unknown) => {
              body += String(chunk);
            });
            
            req.on('end', () => {
              try {
                const logData: unknown = JSON.parse(body);
                if (logData === null || logData === undefined || typeof logData !== 'object') {
                  return;
                }
                const logDataObj = logData as Record<string, unknown>;
                if (logDataObj['logs'] !== undefined && Array.isArray(logDataObj['logs'])) {
                  // Browser logs processing disabled per TEN_COMMANDMENTS
                  // All console statements must be removed
                }
                
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'received' }));
              } catch {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Clean up inactive peers every 30 seconds
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 1 minute timeout
  
  Object.keys(gameState.peers).forEach(peerId => {
    const peer = gameState.peers[peerId];
    if (peer && now - peer.lastUpdate > timeout) {
      delete gameState.peers[peerId];
    }
  });
}, 30000);

// Start server
server.listen(config.port, config.host, () => {
  logConfig();
  // Server startup logging disabled per TEN_COMMANDMENTS
  // All console statements must be removed
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // SIGTERM logging disabled per TEN_COMMANDMENTS
  // All console statements must be removed
  server.close(() => {
    // Server close logging disabled per TEN_COMMANDMENTS
    // All console statements must be removed
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  // SIGINT logging disabled per TEN_COMMANDMENTS
  // All console statements must be removed
  server.close(() => {
    // Server close logging disabled per TEN_COMMANDMENTS
    // All console statements must be removed
    process.exit(0);
  });
});