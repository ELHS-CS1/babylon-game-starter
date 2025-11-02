// ============================================================================
// PLAYER TYPES - Shared types to avoid circular dependencies
// ============================================================================

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

export interface GameState {
  isConnected: boolean;
  players: Player[];
  environment: string;
  lastUpdate: number;
  serverTime: number;
  connections: number;
}
