// DataStar SSE State Management - Following the 10 Commandments as God's word!
// Based on: https://data-star.dev/guide/getting_started

import { logger } from './utils/logger';
import { dataStarIntegration } from './datastar-integration';

// Game state interface - NO TS ANY!
export interface GameState {
  isConnected: boolean;
  players: Player[];
  environment: string;
  lastUpdate: number;
  serverTime: number;
  connections: number;
}

// Player interface - NO TS ANY!
export interface Player {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  environment: string;
  character: string;
  boostActive: boolean;
  state: string;
  lastUpdate: number;
}

// Initialize game state - FOLLOWING THE SACRED COMMANDMENTS!
export const gameState: GameState = {
  isConnected: false,
  players: [],
  environment: 'Level Test',
  lastUpdate: Date.now(),
  serverTime: 0,
  connections: 0
};

// DataStar SSE connection - Backend-driven state management
logger.info('🚀 Initializing DataStar SSE connection', { context: 'State', tag: 'connection' });
logger.info('🔍 Testing logger import...', { context: 'State', tag: 'connection' });
import { getSSEUrl, getSendUrl, logServerConfig } from './utils/serverUrl';

// Log server configuration for debugging
logServerConfig();
logger.info(`🚀 Attempting SSE connection to: ${getSSEUrl()}`, { context: 'State', tag: 'connection' });
logger.info('🔍 Logger call completed', { context: 'State', tag: 'connection' });

// Initialize DataStar integration for real-time updates
logger.info('✅ DataStar integration initialized', { context: 'State', tag: 'connection' });

// DataStar integration handles all SSE communication
// The DataStarIntegration class manages the DataStar client connection
// and updates gameState based on patched DOM elements

// DataStar SSE message handling - Backend-driven state management
// The DataStarIntegration class handles all SSE events and updates gameState
// based on patched DOM elements from the backend

// Peer validation function - NO TS ANY!
export function isValidPeer(peer: unknown): peer is Player {
  if (peer === null || peer === undefined || typeof peer !== 'object') {
    return false;
  }
  
  const p = peer as Record<string, unknown>;
  
  return (
    typeof p['id'] === 'string' &&
    typeof p['name'] === 'string' &&
    typeof p['environment'] === 'string' &&
    typeof p['lastUpdate'] === 'number' &&
    typeof p['position'] === 'object' &&
    p['position'] !== null &&
    typeof (p['position'] as Record<string, unknown>)['x'] === 'number' &&
    typeof (p['position'] as Record<string, unknown>)['y'] === 'number' &&
    typeof (p['position'] as Record<string, unknown>)['z'] === 'number' &&
    typeof p['rotation'] === 'object' &&
    p['rotation'] !== null &&
    typeof (p['rotation'] as Record<string, unknown>)['x'] === 'number' &&
    typeof (p['rotation'] as Record<string, unknown>)['y'] === 'number' &&
    typeof (p['rotation'] as Record<string, unknown>)['z'] === 'number'
  );
}

// DataStar SSE send function - Backend communication
export async function sendToServer(data: unknown): Promise<void> {
  try {
    const response = await fetch(getSendUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`❌ DataStar send failed: ${response.status}`, { context: 'State', tag: 'connection' });
      return;
    }

    logger.info('✅ DataStar send successful', { context: 'State', tag: 'connection' });
  } catch (error) {
    logger.error('❌ DataStar send error', { context: 'State', tag: 'connection' });
    logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'State', tag: 'connection' });
  }
}

// Export DataStar integration for use in other components
export { dataStarIntegration };