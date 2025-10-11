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

  connect(_url: string = 'https://localhost:10000/api/datastar/sse'): void {
    try {
      // DataStar handles SSE internally - we just need to listen for DOM changes
      setConnected(true);
      this.reconnectAttempts = 0;
      logger.info('✅ DataStar connection established via client library', { context: 'DataStar', tag: 'connection' });
    } catch {
      this.handleReconnect();
    }
  }

  // DataStar handles message processing internally via DOM changes
  // No need for manual message handling

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
