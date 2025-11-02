// ============================================================================
// PEER DATA TYPES - STRONGLY TYPED DISCRIMINATED UNION
// ============================================================================

// Base peer data matching Player interface
export interface BasePeerData {
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

// Full peer data update event
export interface PeerDataUpdateEvent {
  type: 'peerDataUpdate';
  data: BasePeerData;
}

// Partial environment change event
export interface EnvironmentChangeEvent {
  type: 'environmentChange';
  peerId: string;
  environment: string;
  lastUpdate: number;
}

// Partial character model change event
export interface CharacterModelChangeEvent {
  type: 'characterModelChange';
  peerId: string;
  character: string;
  lastUpdate: number;
}

// Discriminated union type
export type PeerDataEvent = 
  | PeerDataUpdateEvent 
  | EnvironmentChangeEvent 
  | CharacterModelChangeEvent;
