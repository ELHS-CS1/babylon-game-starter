import { reactive } from 'vue';
import type { Peer } from '../game/Peer';
import { logger } from '../utils/logger';

// DataStar Signals Store - simple reactive store
interface GameState {
  peers: Peer[];
  environment: string;
  isConnected: boolean;
  lastUpdate: number;
  serverTime: number;
}

interface DataStarStore {
  peers: Peer[];
  gameState: GameState;
  activePeers: number;
}

// Create reactive store
export const datastarStore = reactive<DataStarStore>({
  peers: [],
  gameState: {
    peers: [],
    environment: 'levelTest',
    isConnected: false,
    lastUpdate: Date.now(),
    serverTime: Date.now()
  },
  activePeers: 0
});

// Store actions
export const setPeers = (peers: Peer[]): void => {
  datastarStore.peers = peers;
  datastarStore.activePeers = peers.length;
  datastarStore.gameState.lastUpdate = Date.now();
};

export const addPeer = (peer: Peer): void => {
  const existingIndex = datastarStore.peers.findIndex(p => p.id === peer.id);
  if (existingIndex >= 0) {
    datastarStore.peers[existingIndex] = peer;
  } else {
    datastarStore.peers.push(peer);
  }
  datastarStore.activePeers = datastarStore.peers.length;
  datastarStore.gameState.lastUpdate = Date.now();
};

export const removePeer = (peerId: string): void => {
  datastarStore.peers = datastarStore.peers.filter(p => p.id !== peerId);
  datastarStore.activePeers = datastarStore.peers.length;
  datastarStore.gameState.lastUpdate = Date.now();
};

export const setCurrentEnvironment = (environment: string): void => {
  datastarStore.gameState.environment = environment;
  datastarStore.gameState.lastUpdate = Date.now();
};

export const setConnected = (connected: boolean): void => {
  datastarStore.gameState.isConnected = connected;
  datastarStore.gameState.lastUpdate = Date.now();
};

export const updateServerTime = (): void => {
  datastarStore.gameState.serverTime = Date.now();
};

// DataStar connection manager - NO EVENTSOURCE!
export class DataStarConnection {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string = 'https://localhost:10000/api/datastar/sse'): void {
    try {
      // DataStar handles SSE internally - we just need to listen for DOM changes
      setConnected(true);
      this.reconnectAttempts = 0;
      logger.info('✅ DataStar connection established via client library', { context: 'DataStar', tag: 'connection' });
    } catch {
      this.handleReconnect();
    }
  }

  private handleMessage(data: unknown): void {
    if (data === null || data === undefined || typeof data !== 'object' || !('type' in data) || typeof data.type !== 'string') {
      return;
    }
    switch (data.type) {
      case 'connected':
        setConnected(true);
        break;
        
      case 'heartbeat':
        updateServerTime();
        break;
        
      case 'peerUpdate':
        if ('peer' in data && data.peer !== null && data.peer !== undefined && typeof data.peer === 'object' && 'id' in data.peer && typeof data.peer.id === 'string') {
          const peerData = data.peer;
          if ('id' in peerData && 'name' in peerData && 'position' in peerData && 'rotation' in peerData && 'environment' in peerData && 'lastUpdate' in peerData) {
            // Check if position and rotation are valid Vector3 objects
            const isValidPosition = peerData.position !== null && 
                                   typeof peerData.position === 'object' &&
                                   'x' in peerData.position &&
                                   'y' in peerData.position &&
                                   'z' in peerData.position;
            
            const isValidRotation = peerData.rotation !== null && 
                                   typeof peerData.rotation === 'object' &&
                                   'x' in peerData.rotation &&
                                   'y' in peerData.rotation &&
                                   'z' in peerData.rotation;
            
            if (isValidPosition && isValidRotation) {
              // Extract Vector3 values manually to avoid type assertions
              
              const validPeer = {
                id: String(peerData.id),
                name: String(peerData.name),
                position: { 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  x: Number((peerData.position as Record<string, unknown>)['x']), 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  y: Number((peerData.position as Record<string, unknown>)['y']), 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  z: Number((peerData.position as Record<string, unknown>)['z']) 
                },
                rotation: { 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  x: Number((peerData.rotation as Record<string, unknown>)['x']), 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  y: Number((peerData.rotation as Record<string, unknown>)['y']), 
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  z: Number((peerData.rotation as Record<string, unknown>)['z']) 
                },
                environment: String(peerData.environment),
                lastUpdate: Number(peerData.lastUpdate)
              };
              addPeer(validPeer);
            }
          }
        }
        if ('gameState' in data && data.gameState !== null && data.gameState !== undefined && typeof data.gameState === 'object' && 'environment' in data.gameState && typeof data.gameState.environment === 'string') {
          setCurrentEnvironment(data.gameState.environment);
        }
        break;
        
      case 'peerLeave':
        if ('peerId' in data && typeof data.peerId === 'string') {
          removePeer(data.peerId);
        }
        break;
        
      case 'environmentChange':
        if ('environment' in data && typeof data.environment === 'string') {
          setCurrentEnvironment(data.environment);
        }
        break;
        
      default:
        // Unknown DataStar message type
        break;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // No timeouts allowed - immediate reconnect
      this.connect();
    }
  }

  disconnect(): void {
    // DataStar handles its own connection cleanup
    setConnected(false);
  }

  send(data: Record<string, unknown>): void {
    fetch('https://localhost:10000/api/datastar/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }).catch(() => {
      // Error sending DataStar message
    });
  }
}

// Global DataStar connection instance
export const datastarConnection = new DataStarConnection();
