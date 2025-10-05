import { reactive, computed } from 'vue';
import type { Peer } from './game/Peer';
import { logger } from './utils/logger';

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
logger.info('🔍 Testing logger import...', { context: 'State', tag: 'connection' });
logger.info('🚀 Attempting SSE connection to: http://localhost:10000/api/datastar/sse', { context: 'State', tag: 'connection' });
logger.info('🔍 Logger call completed', { context: 'State', tag: 'connection' });

// Try to create EventSource with error handling
let eventSource: EventSource;
try {
  eventSource = new EventSource('http://localhost:10000/api/datastar/sse');
  logger.info('✅ EventSource created successfully', { context: 'State', tag: 'connection' });
  
  // Add immediate debugging
  logger.info(`🔍 EventSource readyState immediately: ${eventSource.readyState}`, { context: 'State', tag: 'connection' });
  logger.info(`🔍 EventSource URL: ${eventSource.url}`, { context: 'State', tag: 'connection' });
  logger.info(`🔍 EventSource withCredentials: ${eventSource.withCredentials}`, { context: 'State', tag: 'connection' });
  
  // Check if browser supports EventSource
  if (typeof EventSource === 'undefined') {
    logger.error('❌ EventSource not supported in this browser', { context: 'State', tag: 'connection' });
  }
} catch (error) {
  logger.error('❌ Failed to create EventSource', { context: 'State', tag: 'connection' });
  logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'State', tag: 'connection' });
  throw error;
}

// Check SSE connection status after a short delay
setTimeout(() => {
  logger.info(`📊 SSE connection status after 2s: readyState=${eventSource.readyState}, connected=${gameState.isConnected}`, { context: 'State', tag: 'connection' });
  logger.info(`📊 EventSource URL: ${eventSource.url}`, { context: 'State', tag: 'connection' });
  logger.info(`📊 EventSource withCredentials: ${eventSource.withCredentials}`, { context: 'State', tag: 'connection' });
  
  // If still connecting, try to test the connection manually
  if (eventSource.readyState === 0) {
    logger.info('🔍 SSE still connecting, testing manual fetch...', { context: 'State', tag: 'connection' });
    fetch('http://localhost:10000/api/datastar/sse')
      .then(response => {
        logger.info(`✅ Manual fetch successful: ${response.status}`, { context: 'State', tag: 'connection' });
        return response.text();
      })
      .then(text => {
        logger.info(`📨 Manual fetch response: ${text}`, { context: 'State', tag: 'connection' });
        
        // If manual fetch works but EventSource doesn't, use polling fallback
        logger.info('🔄 EventSource failed, switching to polling fallback...', { context: 'State', tag: 'connection' });
        gameState.isConnected = true;
        logger.info('✅ Connection state updated to: true (polling fallback)', { context: 'State', tag: 'connection' });
        
        // Start polling for updates
        const pollInterval = setInterval(() => {
          fetch('http://localhost:10000/api/datastar/sse')
            .then(response => response.text())
            .then(text => {
              logger.info(`📨 Polling response: ${text}`, { context: 'State', tag: 'connection' });
              // Parse and handle the response like SSE
              try {
                const data = JSON.parse(text.split('\n')[0].replace('data: ', ''));
                logger.info(`📊 Parsed polling data: ${JSON.stringify(data)}`, { context: 'State', tag: 'connection' });
              } catch (e) {
                logger.info(`📊 Raw polling data: ${text}`, { context: 'State', tag: 'connection' });
              }
            })
            .catch(error => {
              logger.error('❌ Polling failed', { context: 'State', tag: 'connection' });
              logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'State', tag: 'connection' });
              clearInterval(pollInterval);
              gameState.isConnected = false;
            });
        }, 5000);
      })
      .catch(error => {
        logger.error('❌ Manual fetch failed', { context: 'State', tag: 'connection' });
        logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'State', tag: 'connection' });
      });
  }
}, 2000);

// Add connection event handlers for debugging - FOLLOWING THE SACRED COMMANDMENTS!
eventSource.onopen = () => {
  logger.info('🔗 SSE connection opened successfully', { context: 'State', tag: 'connection' });
  gameState.isConnected = true;
  logger.info(`✅ Connection state updated to: ${gameState.isConnected}`, { context: 'State', tag: 'connection' });
};

eventSource.onerror = (error) => {
  logger.error('❌ SSE connection error', { context: 'State', tag: 'connection' });
  logger.error(`📊 Error details: ${error}`, { context: 'State', tag: 'connection' });
  logger.error(`📊 EventSource readyState: ${eventSource.readyState}`, { context: 'State', tag: 'connection' });
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
