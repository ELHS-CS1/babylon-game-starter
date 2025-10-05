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

// Add connection event handlers for debugging - FOLLOWING THE SACRED COMMANDMENTS!
eventSource.onopen = () => {
  logger.info('🔗 SSE connection opened successfully', { context: 'State', tag: 'connection' });
  gameState.isConnected = true;
  logger.info(`✅ Connection state updated to: ${gameState.isConnected}`, { context: 'State', tag: 'connection' });
};

eventSource.onerror = (error) => {
  logger.error('❌ SSE connection error', { context: 'State', tag: 'connection' });
  logger.error(`📊 Error details: ${error}`, { context: 'State', tag: 'connection' });
  gameState.isConnected = false;
  logger.info(`❌ Connection state updated to: ${gameState.isConnected}`, { context: 'State', tag: 'connection' });
};

    eventSource.onmessage = (event) => {
      try {
        const dataString = typeof event.data === 'string' ? event.data : String(event.data);
        logger.info(`📨 Received SSE message: ${dataString}`, { context: 'State', tag: 'sse' });
        
        const update: unknown = JSON.parse(dataString);
        if (update === null || update === undefined || typeof update !== 'object' || !('type' in update) || typeof update.type !== 'string') {
          logger.warn('⚠️ Invalid SSE message format - ignoring', { context: 'State', tag: 'sse' });
          return;
        }
    
    // Handle different message types with proper type checking
    switch (update.type) {
      case 'connected':
        logger.info('🔗 Received connected message from server', { context: 'State', tag: 'sse' });
        gameState.isConnected = true;
        gameState.lastUpdate = Date.now();
        break;
        
      case 'heartbeat':
        gameState.lastUpdate = Date.now();
        break;
        
      case 'peerUpdate':
        logger.info('👥 Received peer update from server', { context: 'State', tag: 'sse' });
        if ('peer' in update && isValidPeer(update.peer)) {
          const peer = update.peer;
          logger.info(`📊 Peer data: ${JSON.stringify(peer)}`, { context: 'State', tag: 'sse' });
          
          // Add or update player
          const existingIndex = gameState.players.findIndex(p => p.id === peer.id);
          if (existingIndex >= 0) {
            logger.info(`🔄 Updating existing peer: ${peer.id}`, { context: 'State', tag: 'sse' });
            gameState.players[existingIndex] = peer;
          } else {
            logger.info(`➕ Adding new peer: ${peer.id}`, { context: 'State', tag: 'sse' });
            gameState.players.push(peer);
          }
          logger.info(`📊 Total peers now: ${gameState.players.length}`, { context: 'State', tag: 'sse' });
        } else {
          logger.warn('⚠️ Invalid peer data in peerUpdate message', { context: 'State', tag: 'sse' });
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
  fetch('http://localhost:10000/api/datastar/send', {
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
