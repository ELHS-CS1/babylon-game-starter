// ============================================================================
// BROADCAST SCHEDULER - Server-side 150ms aggregated broadcast system
// ============================================================================

import type { PeerDataManager } from './PeerDataManager.js';
import type { SSEManager } from './SSEManager.js';

export class BroadcastScheduler {
  private peerDataManager: PeerDataManager;
  private sseManager: SSEManager;
  private intervalId: NodeJS.Timeout | null = null;
  private staleCleanupId: NodeJS.Timeout | null = null;
  private readonly BROADCAST_INTERVAL_MS = 150;
  private readonly STALE_CLEANUP_INTERVAL_MS = 30000; // 30 seconds

  constructor(peerDataManager: PeerDataManager, sseManager: SSEManager) {
    this.peerDataManager = peerDataManager;
    this.sseManager = sseManager;
  }

  public start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.broadcastAggregatedState(), this.BROADCAST_INTERVAL_MS);
    this.staleCleanupId = setInterval(() => this.peerDataManager.cleanupStalePeers(), this.STALE_CLEANUP_INTERVAL_MS);
    console.log(`📡 BroadcastScheduler started (${this.BROADCAST_INTERVAL_MS}ms broadcast, ${this.STALE_CLEANUP_INTERVAL_MS}ms stale cleanup)`);
  }

  private broadcastAggregatedState(): void {
    const gameState = this.peerDataManager.getGameState();
    const environments = new Set<string>();
    
    Object.values(gameState.peers).forEach(peer => environments.add(peer.environment));
    
    environments.forEach(environment => {
      const environmentPeers = this.peerDataManager.getPeersByEnvironment(environment);
      if (environmentPeers.length > 0) {
        this.sseManager.broadcastToEnvironment(environment, {
          type: 'aggregatedPeerUpdate',
          environment,
          peers: environmentPeers,
          timestamp: Date.now()
        });
        console.log(`📡 Broadcast to ${environment}: ${environmentPeers.length} peers`);
      }
    });
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.staleCleanupId) {
      clearInterval(this.staleCleanupId);
      this.staleCleanupId = null;
    }
    console.log('📡 BroadcastScheduler stopped');
  }
}
