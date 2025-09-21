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

  constructor() {
    // Initialize with empty peer list
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

  // Get all peers
  getAllPeers(): Peer[] {
    return Array.from(this.peers.values());
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
