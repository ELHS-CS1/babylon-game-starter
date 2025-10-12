// ============================================================================
// LOCAL PEER DATA SERVICE PROVIDER - SINGLETON WITH DIFFERENTIAL UPDATES
// ============================================================================

import { dataStarIntegration } from '../datastar-integration';
import { logger } from '../utils/logger';
import type { CharacterController } from '../game/CharacterController';
import type { PeerDataEvent, BasePeerData } from '../types/peerData';

export class LocalPeerDataServiceProvider {
  private static instance: LocalPeerDataServiceProvider | null = null;
  private characterController: CharacterController | null = null;
  private intervalId: number | null = null;
  private readonly UPDATE_INTERVAL_MS = 150;
  private readonly POSITION_THRESHOLD = 0.001; // Only send if position changed by more than this
  private readonly ROTATION_THRESHOLD = 0.001; // Only send if rotation changed by more than this
  private peerId: string | null = null;
  private playerName: string | null = null;
  private currentEnvironment: string | null = null;
  private currentCharacter: string | null = null;
  
  // Cache for diff calculation
  private lastSentData: BasePeerData | null = null;

  private constructor() {
    logger.info('LocalPeerDataServiceProvider initialized', { context: 'LocalPeerDataServiceProvider' });
  }

  public static getInstance(): LocalPeerDataServiceProvider {
    if (!LocalPeerDataServiceProvider.instance) {
      LocalPeerDataServiceProvider.instance = new LocalPeerDataServiceProvider();
    }
    return LocalPeerDataServiceProvider.instance;
  }

  public initialize(
    characterController: CharacterController,
    peerId: string,
    playerName: string,
    environment: string,
    character: string
  ): void {
    this.characterController = characterController;
    this.peerId = peerId;
    this.playerName = playerName;
    this.currentEnvironment = environment;
    this.currentCharacter = character;
    
    // Reset cache on initialization
    this.lastSentData = null;
    
    this.startPolling();
    logger.info('LocalPeerDataServiceProvider started polling', { context: 'LocalPeerDataServiceProvider' });
  }

  private startPolling(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.sendPeerDataUpdate();
    }, this.UPDATE_INTERVAL_MS);
  }

  private hasPositionChanged(oldPos: { x: number; y: number; z: number }, newPos: { x: number; y: number; z: number }): boolean {
    return Math.abs(oldPos.x - newPos.x) > this.POSITION_THRESHOLD ||
           Math.abs(oldPos.y - newPos.y) > this.POSITION_THRESHOLD ||
           Math.abs(oldPos.z - newPos.z) > this.POSITION_THRESHOLD;
  }

  private hasRotationChanged(oldRot: { x: number; y: number; z: number }, newRot: { x: number; y: number; z: number }): boolean {
    return Math.abs(oldRot.x - newRot.x) > this.ROTATION_THRESHOLD ||
           Math.abs(oldRot.y - newRot.y) > this.ROTATION_THRESHOLD ||
           Math.abs(oldRot.z - newRot.z) > this.ROTATION_THRESHOLD;
  }

  private calculateDiff(newData: BasePeerData): Partial<BasePeerData> | null {
    // First send: send everything
    if (!this.lastSentData) {
      return newData;
    }

    const diff: Partial<BasePeerData> = {};
    let hasChanges = false;

    // Always include id for server to identify the peer
    diff.id = newData.id;

    // Check position
    if (this.hasPositionChanged(this.lastSentData.position, newData.position)) {
      diff.position = newData.position;
      hasChanges = true;
    }

    // Check rotation
    if (this.hasRotationChanged(this.lastSentData.rotation, newData.rotation)) {
      diff.rotation = newData.rotation;
      hasChanges = true;
    }

    // Check other properties
    if (this.lastSentData.state !== newData.state) {
      diff.state = newData.state;
      hasChanges = true;
    }

    if (this.lastSentData.boostActive !== newData.boostActive) {
      diff.boostActive = newData.boostActive;
      hasChanges = true;
    }

    if (this.lastSentData.environment !== newData.environment) {
      diff.environment = newData.environment;
      hasChanges = true;
    }

    if (this.lastSentData.character !== newData.character) {
      diff.character = newData.character;
      hasChanges = true;
    }

    if (this.lastSentData.name !== newData.name) {
      diff.name = newData.name;
      hasChanges = true;
    }

    // Always include lastUpdate when sending
    if (hasChanges) {
      diff.lastUpdate = newData.lastUpdate;
      return diff;
    }

    return null; // No changes, don't send
  }

  private sendPeerDataUpdate(): void {
    if (!this.characterController || !this.peerId || !this.playerName) {
      return;
    }

    const characterState = this.characterController.getCharacterState();
    const currentCharacter = this.characterController.getCurrentCharacter();

    const peerData: BasePeerData = {
      id: this.peerId,
      name: this.playerName,
      position: characterState.position,
      rotation: characterState.rotation,
      environment: this.currentEnvironment ?? 'unknown',
      character: currentCharacter?.name ?? this.currentCharacter ?? 'unknown',
      boostActive: characterState.boostActive,
      state: characterState.state,
      lastUpdate: Date.now()
    };

    // Calculate diff
    const diff = this.calculateDiff(peerData);

    // Only send if there are changes
    if (!diff) {
      return;
    }

    const event: PeerDataEvent = {
      type: 'peerDataUpdate',
      data: diff as BasePeerData // Server handles partial updates
    };

    try {
      dataStarIntegration.send(event);
      // Update cache with full data
      this.lastSentData = peerData;
    } catch (error) {
      logger.error('Failed to send peer data update', { 
        context: 'LocalPeerDataServiceProvider', 
        error 
      });
    }
  }

  public changeEnvironment(newEnvironment: string): void {
    if (!this.peerId) {
      logger.warn('Cannot change environment: peerId not set', { context: 'LocalPeerDataServiceProvider' });
      return;
    }

    this.currentEnvironment = newEnvironment;

    const event: PeerDataEvent = {
      type: 'environmentChange',
      peerId: this.peerId,
      environment: newEnvironment,
      lastUpdate: Date.now()
    };

    try {
      dataStarIntegration.send(event);
      logger.info(`Environment changed to: ${newEnvironment}`, { context: 'LocalPeerDataServiceProvider' });
      
      // Update cache
      if (this.lastSentData) {
        this.lastSentData.environment = newEnvironment;
      }
    } catch (error) {
      logger.error('Failed to send environment change', { 
        context: 'LocalPeerDataServiceProvider', 
        error 
      });
    }
  }

  public changeCharacterModel(newCharacter: string): void {
    if (!this.peerId) {
      logger.warn('Cannot change character: peerId not set', { context: 'LocalPeerDataServiceProvider' });
      return;
    }

    this.currentCharacter = newCharacter;

    const event: PeerDataEvent = {
      type: 'characterModelChange',
      peerId: this.peerId,
      character: newCharacter,
      lastUpdate: Date.now()
    };

    try {
      dataStarIntegration.send(event);
      logger.info(`Character model changed to: ${newCharacter}`, { context: 'LocalPeerDataServiceProvider' });
      
      // Update cache
      if (this.lastSentData) {
        this.lastSentData.character = newCharacter;
      }
    } catch (error) {
      logger.error('Failed to send character model change', { 
        context: 'LocalPeerDataServiceProvider', 
        error 
      });
    }
  }

  public stopPolling(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('LocalPeerDataServiceProvider stopped polling', { context: 'LocalPeerDataServiceProvider' });
    }
  }

  public dispose(): void {
    this.stopPolling();
    this.characterController = null;
    this.peerId = null;
    this.playerName = null;
    this.currentEnvironment = null;
    this.currentCharacter = null;
    this.lastSentData = null;
  }
}

export const localPeerDataService = LocalPeerDataServiceProvider.getInstance();
