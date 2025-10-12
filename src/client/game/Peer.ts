import type { Scene, Observer } from '@babylonjs/core';
import { logger } from '../utils/logger';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Peer {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  environment: string;
  lastUpdate: number;
}

export class PeerManager {
  private peers: Map<string, Peer> = new Map();
  private localPeer: Peer | null = null;
  private scene: Scene | null = null;
  private cleanupObserver: Observer<Scene> | null = null;
  private cleanupFrameCount: number = 0;
  private cleanupInterval: number = 300; // Check every 300 frames (5 seconds at 60fps)
  private defaultTimeoutMs: number = 60000; // 60 seconds default timeout
  private currentEnvironment: string = 'levelTest';

  constructor() {
    // Initialize with empty peer list
  }

  /**
   * Initializes the PeerManager with automatic cleanup
   * @param scene The Babylon.js scene
   */
  public initialize(scene: Scene): void {
    this.scene = scene;
    this.setupAutomaticCleanup();
    logger.info("PeerManager initialized with automatic cleanup", { context: 'PeerManager', tag: 'peer' });
  }

  /**
   * Sets up automatic peer cleanup using onBeforeRenderObservable
   */
  private setupAutomaticCleanup(): void {
    if (!this.scene) {
      logger.warn("Scene not available for automatic cleanup setup", { context: 'PeerManager', tag: 'peer' });
      return;
    }

    // Peer cleanup handled by default Babylon.js render loop like the playground

    logger.info("Automatic peer cleanup setup complete", { context: 'PeerManager', tag: 'peer' });
  }

  /**
   * Updates peer cleanup checking
   */
  private updateCleanup(): void {
    this.cleanupFrameCount++;
    if (this.cleanupFrameCount < this.cleanupInterval) {
      return; // Skip this frame
    }
    this.cleanupFrameCount = 0; // Reset counter

    // Perform automatic cleanup
    this.performAutomaticCleanup();
  }

  /**
   * Performs automatic cleanup of inactive peers
   * @param timeoutMs Timeout in milliseconds for peer inactivity
   * @returns Array of removed peer IDs
   */
  public performAutomaticCleanup(timeoutMs: number = this.defaultTimeoutMs): string[] {
    const allPeers = Array.from(this.peers.values());
    const now = Date.now();
    const inactivePeers = allPeers.filter(peer => now - peer.lastUpdate > timeoutMs);
    const removedIds: string[] = [];

    inactivePeers.forEach(peer => {
      this.removePeer(peer.id);
      removedIds.push(peer.id);
      logger.info(`Peer ${peer.id} automatically cleaned up (inactive for ${now - peer.lastUpdate}ms)`, { context: 'PeerManager', tag: 'peer' });
    });

    if (removedIds.length > 0) {
      logger.info(`Automatic cleanup: ${removedIds.length} inactive peers removed`, { context: 'PeerManager', tag: 'peer' });
    }

    return removedIds;
  }

  /**
   * Disposes the PeerManager and cleans up observers
   */
  public dispose(): void {
    if (this.cleanupObserver && this.scene) {
      // Cleanup observer removed - using default Babylon.js render loop
      this.cleanupObserver = null;
    }
    this.scene = null;
    this.clearPeers();
    logger.info("PeerManager disposed", { context: 'PeerManager', tag: 'peer' });
  }

  // Create a new local peer
  createLocalPeer(name: string, environment: string): Peer {
    const id = this.generatePeerId();
    const peer: Peer = {
      id,
      name,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      environment,
      lastUpdate: Date.now()
    };

    this.localPeer = peer;
    this.peers.set(id, peer);
    return peer;
  }

  // Update local peer position and rotation
  updateLocalPeer(position: Vector3, rotation: Vector3): void {
    if (!this.localPeer) return;

    this.localPeer.position = { ...position };
    this.localPeer.rotation = { ...rotation };
    this.localPeer.lastUpdate = Date.now();
  }

  // Add or update a remote peer
  addRemotePeer(peer: Peer): void {
    this.peers.set(peer.id, { ...peer });
  }

  // Remove a peer
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    if (this.localPeer && this.localPeer.id === peerId) {
      this.localPeer = null;
    }
  }

  // Get all peers in a specific environment
  getPeersInEnvironment(environment: string): Peer[] {
    return Array.from(this.peers.values())
      .filter(peer => peer.environment === environment);
  }

  // Get local peer
  getLocalPeer(): Peer | null {
    return this.localPeer;
  }

  // Get peer by ID
  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  // Check if peer exists
  hasPeer(peerId: string): boolean {
    return this.peers.has(peerId);
  }

  // Clear all peers
  clearPeers(): void {
    this.peers.clear();
    this.localPeer = null;
  }

  // Generate unique peer ID
  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get peer count
  getPeerCount(): number {
    return this.peers.size;
  }

  // Get peer count for specific environment
  getPeerCountInEnvironment(environment: string): number {
    return this.getPeersInEnvironment(environment).length;
  }

  // Update peer data
  updatePeer(peerId: string, updates: Partial<Peer>): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      Object.assign(peer, updates);
      peer.lastUpdate = Date.now();
    }
  }

  // Check if peer is local
  isLocalPeer(peerId: string): boolean {
    return this.localPeer?.id === peerId;
  }

  // Set current environment for filtering
  setCurrentEnvironment(environment: string): void {
    const oldEnvironment = this.currentEnvironment;
    this.currentEnvironment = environment;
    logger.info(`Environment changed from ${oldEnvironment} to: ${environment}`, { context: 'PeerManager', tag: 'peer' });
    
    // Clear peers from old environment
    this.clearPeersFromEnvironment(oldEnvironment);
    
    // Request peers from new environment
    this.requestPeersFromEnvironment(environment);
  }

  private clearPeersFromEnvironment(environment: string): void {
    const peersToRemove: string[] = [];
    this.peers.forEach((peer, peerId) => {
      if (peer.environment === environment) {
        peersToRemove.push(peerId);
      }
    });
    
    peersToRemove.forEach(peerId => {
      this.peers.delete(peerId);
      logger.info(`Removed peer ${peerId} from environment ${environment}`, { context: 'PeerManager', tag: 'peer' });
    });
  }

  private requestPeersFromEnvironment(environment: string): void {
    logger.info(`Requesting peers from environment: ${environment}`, { context: 'PeerManager', tag: 'peer' });
    
    // Import DataStar integration to send the request
    import('../datastar-integration').then(({ dataStarIntegration }) => {
      dataStarIntegration.send({
        type: 'requestPeers',
        environment: environment,
        timestamp: Date.now()
      });
    }).catch(error => {
      logger.error('Failed to import DataStar integration:', { context: 'PeerManager', tag: 'peer', error });
    });
  }

  // Get current environment
  getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  // Get all peers (regardless of environment)
  getAllPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  // Get peers only in current environment (for rendering)
  getPeersInCurrentEnvironment(): Peer[] {
    return Array.from(this.peers.values())
      .filter(peer => peer.environment === this.currentEnvironment);
  }

  // Get peers in specific environment
  getPeersInEnvironmentSpecific(environment: string): Peer[] {
    return Array.from(this.peers.values())
      .filter(peer => peer.environment === environment);
  }

  // Get peer count for current environment only
  getPeerCountInCurrentEnvironment(): number {
    return this.getPeersInCurrentEnvironment().length;
  }

  // Get total peer count across all environments
  getTotalPeerCount(): number {
    return this.peers.size;
  }

  // Get environment statistics
  getEnvironmentStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.peers.forEach(peer => {
      const env = peer.environment;
      stats[env] = (stats[env] || 0) + 1;
    });
    return stats;
  }

  // Get peers by environment (useful for debugging)
  getPeersByEnvironment(): Record<string, Peer[]> {
    const peersByEnv: Record<string, Peer[]> = {};
    this.peers.forEach(peer => {
      const env = peer.environment;
      if (!peersByEnv[env]) {
        peersByEnv[env] = [];
      }
      peersByEnv[env].push(peer);
    });
    return peersByEnv;
  }

  // Get peers that need cleanup (inactive for too long)
  getInactivePeers(timeoutMs: number = 60000): Peer[] {
    const now = Date.now();
    return Array.from(this.peers.values())
      .filter(peer => now - peer.lastUpdate > timeoutMs);
  }

  // Clean up inactive peers
  cleanupInactivePeers(timeoutMs: number = 60000): string[] {
    const inactivePeers = this.getInactivePeers(timeoutMs);
    const removedIds: string[] = [];
    
    inactivePeers.forEach(peer => {
      this.removePeer(peer.id);
      removedIds.push(peer.id);
    });
    
    return removedIds;
  }
}
