import { reactive } from 'vue';
import type { Peer } from '../game/Peer';

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

// DataStar connection manager
export class DataStarConnection {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = '/api/datastar/sse'): void {
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        setConnected(true);
        this.reconnectAttempts = 0;
      };

    this.eventSource.onmessage = (event) => {
      try {
        const dataString = typeof event.data === 'string' ? event.data : String(event.data);
        const data: unknown = JSON.parse(dataString);
        this.handleMessage(data);
      } catch {
        // Error parsing SSE message
      }
    };

      this.eventSource.onerror = () => {
        setConnected(false);
        this.handleReconnect();
      };

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
            // Type guard for Vector3 without type assertions
            const isVector3 = (obj: unknown): obj is { x: number; y: number; z: number } => {
              if (obj === null || typeof obj !== 'object') return false;
              if (!('x' in obj) || !('y' in obj) || !('z' in obj)) return false;
              const objRecord = obj as Record<string, unknown>;
              return typeof objRecord.x === 'number' && 
                     typeof objRecord.y === 'number' && 
                     typeof objRecord.z === 'number';
            };
            
            if (isVector3(peerData.position) && isVector3(peerData.rotation)) {
              const validPeer = {
                id: String(peerData.id),
                name: String(peerData.name),
                position: peerData.position,
                rotation: peerData.rotation,
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
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      setConnected(false);
    }
  }

  send(data: Record<string, unknown>): void {
    fetch('/api/datastar/send', {
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
