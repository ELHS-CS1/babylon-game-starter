import { reactive, computed } from 'vue';
import type { Peer } from './game/Peer';

// Type guard function to check if object is a valid Peer
function isValidPeer(obj: unknown): obj is Peer {
  return obj !== null && obj !== undefined && typeof obj === 'object' &&
    'id' in obj && typeof obj.id === 'string' &&
    'name' in obj && typeof obj.name === 'string' &&
    'position' in obj && typeof obj.position === 'object' &&
    'rotation' in obj && typeof obj.rotation === 'object' &&
    'environment' in obj && typeof obj.environment === 'string' &&
    'lastUpdate' in obj && typeof obj.lastUpdate === 'number';
}

// Define proper interfaces following TEN_COMMANDMENTS
interface GameObject {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
}

interface GameState {
  players: Peer[];
  objects: GameObject[];
  status: string;
  environment: string;
  isConnected: boolean;
  lastUpdate: number;
}


// Simple reactive game state - following your buddy's pattern
export const gameState = reactive<GameState>({
  players: [],
  objects: [],
  status: 'waiting',
  environment: 'levelTest',
  isConnected: false,
  lastUpdate: Date.now()
});

// Connect to DataStar SSE - simple and clean
const eventSource = new EventSource('http://localhost:10000/api/datastar/sse');

    eventSource.onmessage = (event) => {
      try {
        const dataString = typeof event.data === 'string' ? event.data : String(event.data);
        const update: unknown = JSON.parse(dataString);
        if (update === null || update === undefined || typeof update !== 'object' || !('type' in update) || typeof update.type !== 'string') {
          return;
        }
    
    // Handle different message types with proper type checking
    switch (update.type) {
      case 'connected':
        gameState.isConnected = true;
        gameState.lastUpdate = Date.now();
        break;
        
      case 'heartbeat':
        gameState.lastUpdate = Date.now();
        break;
        
      case 'peerUpdate':
        if ('peer' in update && isValidPeer(update.peer)) {
          const peer = update.peer;
          // Add or update player
          const existingIndex = gameState.players.findIndex(p => p.id === peer.id);
          if (existingIndex >= 0) {
            gameState.players[existingIndex] = peer;
          } else {
            gameState.players.push(peer);
          }
        }
        if ('gameState' in update && update.gameState !== null && update.gameState !== undefined && typeof update.gameState === 'object' && 'environment' in update.gameState && typeof update.gameState.environment === 'string') {
          gameState.environment = update.gameState.environment;
        }
        gameState.lastUpdate = Date.now();
        break;
        
      case 'peerLeave':
        if ('peerId' in update && typeof update.peerId === 'string') {
          gameState.players = gameState.players.filter(p => p.id !== update.peerId);
        }
        gameState.lastUpdate = Date.now();
        break;
        
      case 'environmentChange':
        if ('environment' in update && typeof update.environment === 'string') {
          gameState.environment = update.environment;
        }
        gameState.lastUpdate = Date.now();
        break;
        
      default:
        // Ignore unknown message types
        break;
    }
  } catch {
    // Error parsing SSE message - ignore
  }
};

eventSource.onerror = () => {
  gameState.isConnected = false;
};

// Send data to server
export const sendToServer = (data: Record<string, unknown>): void => {
  fetch('/api/datastar/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }).catch(() => {
    // Error sending - ignore
  });
};

// Computed properties for UI
export const activePlayers = computed(() => gameState.players.length);
export const playersInCurrentEnvironment = computed(() => 
  gameState.players.filter(player => player.environment === gameState.environment));
