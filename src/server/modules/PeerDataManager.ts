// ============================================================================
// PEER DATA MANAGER - Centralized peer state and operations management
// ============================================================================

import type { ServerResponse } from 'http';

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
  character: string;
  boostActive: boolean;
  state: string;
  lastUpdate: number;
}

export interface GameState {
  peers: Record<string, Peer>;
  environments: string[];
}

export class PeerDataManager {
  private gameState: GameState;
  private connectionToPeerMap: Map<ServerResponse, string>;

  constructor() {
    this.gameState = {
      peers: {},
      environments: ['levelTest', 'islandTown', 'joyTown', 'mansion', 'firefoxReality']
    };
    this.connectionToPeerMap = new Map();
  }

  // Type guards
  public isVector3(obj: unknown): obj is Vector3 {
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

  public isPeer(obj: unknown): obj is Peer {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return false;
    }
    
    return 'id' in obj && typeof obj['id'] === 'string' &&
           'name' in obj && typeof obj['name'] === 'string' &&
           'position' in obj && this.isVector3(obj['position']) &&
           'rotation' in obj && this.isVector3(obj['rotation']) &&
           'environment' in obj && typeof obj['environment'] === 'string' &&
           'lastUpdate' in obj && typeof obj['lastUpdate'] === 'number';
  }

  // Peer operations
  public addPeer(playerName: string, peerId: string, character: string = 'Red', environment: string = 'levelTest'): Peer {
    // Use client's UUIDv4 peer ID instead of generating our own
    const playerId = peerId;
    const newPlayer: Peer = {
      id: playerId,
      name: playerName,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      environment: environment, // Each peer can start in their own environment
      character,
      boostActive: false,
      state: 'idle',
      lastUpdate: Date.now()
    };
    
    this.gameState.peers[playerId] = newPlayer;
    console.log('✅ Player added to game state:', newPlayer);
    
    return newPlayer;
  }

  public removePeer(peerId: string): void {
    if (this.gameState.peers[peerId]) {
      delete this.gameState.peers[peerId];
      console.log(`👋 Peer ${peerId} removed from game state`);
    }
  }

  public updatePeerPosition(
    peerId: string,
    position?: Vector3,
    rotation?: Vector3,
    boostActive?: boolean,
    state?: string
  ): boolean {
    const peer = this.gameState.peers[peerId];
    if (!peer) {
      return false;
    }

    if (position && this.isVector3(position)) {
      peer.position = position;
    }
    
    if (rotation && this.isVector3(rotation)) {
      peer.rotation = rotation;
    }
    
    if (boostActive !== undefined) {
      peer.boostActive = boostActive;
    }
    
    if (state !== undefined) {
      peer.state = state;
    }
    
    peer.lastUpdate = Date.now();
    return true;
  }

  public getPeer(peerId: string): Peer | undefined {
    return this.gameState.peers[peerId];
  }

  public getPeersByEnvironment(environment: string): Peer[] {
    return Object.values(this.gameState.peers)
      .filter(peer => peer.environment === environment);
  }

  public getAllPeers(): Peer[] {
    return Object.values(this.gameState.peers);
  }

  public getPeerCount(): number {
    return Object.keys(this.gameState.peers).length;
  }

  public getGameState(): Readonly<GameState> {
    return this.gameState;
  }

  // Connection mapping
  public associateConnectionWithPeer(res: ServerResponse, peerId: string): void {
    this.connectionToPeerMap.set(res, peerId);
    console.log(`🔗 Associated connection with peer ID: ${peerId}`);
  }

  public getPeerIdFromConnection(res: ServerResponse): string | undefined {
    return this.connectionToPeerMap.get(res);
  }

  public removeConnectionMapping(res: ServerResponse): void {
    const peerId = this.connectionToPeerMap.get(res);
    if (peerId) {
      this.connectionToPeerMap.delete(res);
      this.removePeer(peerId);
    }
  }

  public logPeersState(): void {
    console.log('🗺️ Current peers map:');
    console.log(`   Total peers: ${this.getPeerCount()}`);
    Object.entries(this.gameState.peers).forEach(([peerId, peerData]) => {
      console.log(`   Peer ${peerId}:`, {
        name: peerData.name,
        environment: peerData.environment,
        position: peerData.position,
        rotation: peerData.rotation,
        character: peerData.character,
        boostActive: peerData.boostActive,
        state: peerData.state,
        lastUpdate: peerData.lastUpdate
      });
    });
  }
}
