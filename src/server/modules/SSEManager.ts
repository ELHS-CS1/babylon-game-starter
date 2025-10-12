// ============================================================================
// SSE MANAGER - Server-Sent Events connection and broadcasting management
// ============================================================================

import type { IncomingMessage, ServerResponse } from 'http';
import type { PeerDataManager } from './PeerDataManager.js';

export class SSEManager {
  private sseConnections: Set<ServerResponse>;
  private peerDataManager: PeerDataManager;
  private corsOrigin: string;

  constructor(peerDataManager: PeerDataManager, corsOrigin: string) {
    this.sseConnections = new Set();
    this.peerDataManager = peerDataManager;
    this.corsOrigin = corsOrigin;
  }

  public handleSSEConnection(req: IncomingMessage, res: ServerResponse): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': this.corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization'
    });

    // Send initial connection event
    res.write('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n');

    // Store connection
    this.sseConnections.add(res);
    console.log(`🔗 SSE connection established. Total connections: ${this.sseConnections.size}`);

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      if (this.sseConnections.has(res)) {
        res.write('data: {"type":"heartbeat","timestamp":' + Date.now() + '}\n\n');
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      this.handleDisconnect(res, heartbeat);
    });

    req.on('error', (error) => {
      console.log(`❌ SSE connection error: ${error.message}`);
      this.handleDisconnect(res, heartbeat);
    });
  }

  private handleDisconnect(res: ServerResponse, heartbeat: NodeJS.Timeout): void {
    this.peerDataManager.removeConnectionMapping(res);
    this.sseConnections.delete(res);
    clearInterval(heartbeat);
    console.log(`🔌 SSE connection closed. Total connections: ${this.sseConnections.size}`);
  }

  public broadcastToAll(data: unknown): void {
    const message = 'data: ' + JSON.stringify(data) + '\n\n';
    this.sseConnections.forEach(res => {
      try {
        res.write(message);
      } catch {
        this.sseConnections.delete(res);
      }
    });
  }

  public broadcastToEnvironment(environment: string, data: unknown): void {
    const message = 'data: ' + JSON.stringify(data) + '\n\n';
    let broadcastCount = 0;
    
    this.sseConnections.forEach(res => {
      const peerId = this.peerDataManager.getPeerIdFromConnection(res);
      const peer = peerId ? this.peerDataManager.getPeer(peerId) : undefined;
      
      if (peer && peer.environment === environment) {
        try {
          res.write(message);
          broadcastCount++;
        } catch {
          this.sseConnections.delete(res);
          this.peerDataManager.removeConnectionMapping(res);
        }
      }
    });
    
    console.log(`📡 Broadcasted to ${broadcastCount} peers in environment: ${environment}`);
  }

  public getConnectionCount(): number {
    return this.sseConnections.size;
  }
}
