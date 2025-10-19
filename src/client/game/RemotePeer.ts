// ============================================================================
// REMOTE PEER - Individual remote peer state management
// ============================================================================

import { Vector3, type Mesh, type AnimationGroup, type IParticleSystem } from '@babylonjs/core';
import type { Player } from '../types/player';
import { logger } from '../utils/logger';
import CONFIG from '../config/gameConfig';

export interface RemotePeerState {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  targetPosition: Vector3;
  targetRotation: Vector3;
  environment: string;
  character: string;
  boostActive: boolean;
  state: string;
  lastUpdate: number;
  lastPositionUpdate: number; // Track when position was last updated
  characterConfig?: any; // Character-specific configuration
}

export class RemotePeer {
  private peerState: RemotePeerState;
  public mesh: Mesh | null = null;
  public particleSystem: IParticleSystem | null = null;
  public animationGroups: {
    walk: AnimationGroup | null;
    idle: AnimationGroup | null;
  } = { walk: null, idle: null };

  constructor(peerId: string, playerName: string) {
    this.peerState = {
      id: peerId,
      name: playerName,
      position: Vector3.Zero(),
      rotation: Vector3.Zero(),
      targetPosition: Vector3.Zero(),
      targetRotation: Vector3.Zero(),
      environment: 'Level Test',
      character: 'Red',
      boostActive: false,
      state: 'idle',
      lastUpdate: Date.now(),
      lastPositionUpdate: Date.now()
    };
  }

  // Method to initialize position state to prevent lerping from origin
  public initializePosition(position: Vector3, rotation: Vector3): void {
    // Set both current and target to the same initial position to avoid lerping from origin
    this.peerState.position = position.clone();
    this.peerState.rotation = rotation.clone();
    this.peerState.targetPosition = position.clone();
    this.peerState.targetRotation = rotation.clone();
    this.peerState.lastPositionUpdate = Date.now();
    
    logger.info(`🎮 Initialized remote peer position: ${position.x}, ${position.y}, ${position.z}`, {
      context: 'RemotePeer',
      tag: 'mp',
      peerId: this.peerState.id
    });
  }

  // Public method called by RemotePeerStateUpdateServiceProvider
  public updateFromRemoteData(data: Partial<Player>): void {
    const POSITION_EPSILON = CONFIG.REMOTE_PEER.POSITION_EPSILON;
    const ROTATION_EPSILON = CONFIG.REMOTE_PEER.ROTATION_EPSILON;

    logger.debug(`🎮 updateFromRemoteData called for peer ${this.peerState.id}:`, {
      context: 'RemotePeer',
      tag: 'mp',
      hasPosition: !!data.position,
      hasRotation: !!data.rotation,
      currentPosition: this.peerState.position,
      currentTargetPosition: this.peerState.targetPosition
    });

    // Update position if provided and change is significant
    if (data.position) {
      const newPosition = new Vector3(
        data.position.x,
        data.position.y + CONFIG.ANIMATION.PLAYER_Y_OFFSET, // Apply same Y offset as local character
        data.position.z
      );
      
      // Check if position change is significant enough to update
      const positionDistance = Vector3.Distance(this.peerState.targetPosition, newPosition);
      if (positionDistance > POSITION_EPSILON) {
        this.peerState.targetPosition = newPosition;
        this.peerState.lastPositionUpdate = Date.now();
        logger.debug(`🎮 Updated position for peer ${this.peerState.id}: distance=${positionDistance.toFixed(4)}`, {
          context: 'RemotePeer',
          tag: 'mp'
        });
      } else {
        logger.debug(`🎮 Position update skipped for peer ${this.peerState.id}: distance=${positionDistance.toFixed(4)} < ${POSITION_EPSILON}`, {
          context: 'RemotePeer',
          tag: 'mp'
        });
      }
    } else {
      // No position data provided - ensure target position is preserved
      logger.debug(`🎮 No position data provided for peer ${this.peerState.id}, preserving current target position`, {
        context: 'RemotePeer',
        tag: 'mp',
        currentTargetPosition: this.peerState.targetPosition
      });
    }

    // Update rotation if provided and change is significant
    if (data.rotation) {
      const newRotation = new Vector3(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
      );
      
      // Check if rotation change is significant enough to update
      const rotationDistance = Vector3.Distance(this.peerState.targetRotation, newRotation);
      if (rotationDistance > ROTATION_EPSILON) {
        this.peerState.targetRotation = newRotation;
        logger.debug(`🎮 Updated rotation for peer ${this.peerState.id}: distance=${rotationDistance.toFixed(4)}`, {
          context: 'RemotePeer',
          tag: 'mp'
        });
      } else {
        logger.debug(`🎮 Rotation update skipped for peer ${this.peerState.id}: distance=${rotationDistance.toFixed(4)} < ${ROTATION_EPSILON}`, {
          context: 'RemotePeer',
          tag: 'mp'
        });
      }
    }

    // Update environment if provided
    if (data.environment !== undefined) {
      this.peerState.environment = data.environment;
    }

    // Update character if provided
    if (data.character !== undefined) {
      this.peerState.character = data.character;
    }

    // Update boost state if provided
    if (data.boostActive !== undefined) {
      const wasBoostActive = this.peerState.boostActive;
      this.peerState.boostActive = data.boostActive;
      
      // Update particle system if boost state changed
      if (wasBoostActive !== data.boostActive) {
        this.updateParticleSystem();
      }
    }

    // Update state if provided
    if (data.state !== undefined) {
      const previousState = this.peerState.state;
      this.peerState.state = data.state;
      
      // Update animation based on state change
      if (previousState !== data.state) {
        this.updateAnimationFromState(data.state);
      }
    }

    // Always update lastUpdate timestamp when we receive any data
    this.peerState.lastUpdate = Date.now();

    logger.info(`Updated peer ${this.peerState.id} from remote data`, {
      context: 'RemotePeer',
      tag: 'mp'
    });
  }

  private updateParticleSystem(): void {
    if (!this.particleSystem) return;

    if (this.peerState.boostActive) {
      this.particleSystem.start();
    } else {
      this.particleSystem.stop();
    }
  }

  private updateAnimationFromState(state: string): void {
    if (!this.animationGroups.walk || !this.animationGroups.idle) {
      logger.warn(`🎭 Remote peer ${this.peerState.id} animations not ready`, {
        context: 'RemotePeer',
        tag: 'animation'
      });
      return;
    }

    // Stop all animations first
    this.animationGroups.walk.stop();
    this.animationGroups.idle.stop();

    // Play animation based on state
    if (state === 'IN_AIR' || state === 'START_JUMP') {
      // For now, use idle for jump states - could add jump animation later
      this.animationGroups.idle.play(true);
      logger.info(`🎭 Remote peer ${this.peerState.id} playing idle (state: ${state})`, {
        context: 'RemotePeer',
        tag: 'animation'
      });
    } else if (state === 'ON_GROUND') {
      // Check if peer is moving based on position changes
      const isMoving = this.isMoving();
      if (isMoving) {
        this.animationGroups.walk.play(true);
        logger.info(`🎭 Remote peer ${this.peerState.id} playing walk (moving)`, {
          context: 'RemotePeer',
          tag: 'animation'
        });
      } else {
        this.animationGroups.idle.play(true);
        logger.info(`🎭 Remote peer ${this.peerState.id} playing idle (not moving)`, {
          context: 'RemotePeer',
          tag: 'animation'
        });
      }
    } else {
      // Default to idle for unknown states
      this.animationGroups.idle.play(true);
      logger.info(`🎭 Remote peer ${this.peerState.id} playing idle (unknown state: ${state})`, {
        context: 'RemotePeer',
        tag: 'animation'
      });
    }
  }

  private isMoving(): boolean {
    // Check if the peer has moved significantly since last update
    const distance = Vector3.Distance(this.peerState.position, this.peerState.targetPosition);
    return distance > 0.01; // Small threshold to detect movement
  }

  public getState(): RemotePeerState {
    return { ...this.peerState };
  }

  public getId(): string {
    return this.peerState.id;
  }

  public getName(): string {
    return this.peerState.name;
  }

  public setCharacterConfig(characterConfig: any): void {
    this.peerState.characterConfig = characterConfig;
    logger.info(`🎮 Set character config for peer ${this.peerState.id}:`, {
      context: 'RemotePeer',
      tag: 'mp',
      characterName: characterConfig?.name,
      rotationSmoothing: characterConfig?.rotationSmoothing
    });
  }

  public interpolate(deltaTime: number, smoothing: number = 0.1): void {
    if (!this.mesh) return;

    // Use character-specific smoothing if available, otherwise use provided smoothing
    const characterSmoothing = this.peerState.characterConfig?.rotationSmoothing ?? smoothing;
    const effectiveSmoothing = characterSmoothing;

    // Store previous position to detect movement
    const previousPosition = this.peerState.position.clone();

    // Calculate distance to target to determine if we should interpolate
    const positionDistance = Vector3.Distance(this.peerState.position, this.peerState.targetPosition);
    const rotationDistance = Vector3.Distance(this.peerState.rotation, this.peerState.targetRotation);

    // Debug logging for position changes during rotation-only updates
    if (positionDistance > 0.001) {
      logger.debug(`🎮 Position interpolation for peer ${this.peerState.id}: distance=${positionDistance.toFixed(4)}`, {
        context: 'RemotePeer',
        tag: 'mp',
        currentPosition: this.peerState.position,
        targetPosition: this.peerState.targetPosition,
        positionDistance,
        effectiveSmoothing
      });
    }

    // Only interpolate position if we recently received position data (within threshold)
    const timeSinceLastPositionUpdate = Date.now() - this.peerState.lastPositionUpdate;
    const shouldInterpolatePosition = positionDistance > CONFIG.REMOTE_PEER.POSITION_EPSILON && 
                                     timeSinceLastPositionUpdate < CONFIG.REMOTE_PEER.POSITION_STALE_THRESHOLD_MS;
    
    if (shouldInterpolatePosition) {
      // Smooth position interpolation using character-specific smoothing
      this.peerState.position.x += (this.peerState.targetPosition.x - this.peerState.position.x) * effectiveSmoothing;
      this.peerState.position.y += (this.peerState.targetPosition.y - this.peerState.position.y) * effectiveSmoothing;
      this.peerState.position.z += (this.peerState.targetPosition.z - this.peerState.position.z) * effectiveSmoothing;
    } else if (positionDistance > CONFIG.REMOTE_PEER.POSITION_EPSILON) {
      // Position distance exists but we haven't received recent position data - this shouldn't happen
      logger.warn(`🎮 Position interpolation blocked for peer ${this.peerState.id}: no recent position data (${timeSinceLastPositionUpdate}ms ago)`, {
        context: 'RemotePeer',
        tag: 'mp',
        positionDistance,
        timeSinceLastPositionUpdate,
        threshold: CONFIG.REMOTE_PEER.POSITION_STALE_THRESHOLD_MS
      });
    }

    if (rotationDistance > CONFIG.REMOTE_PEER.ROTATION_EPSILON) {
      // Smooth rotation interpolation using character-specific smoothing
      this.peerState.rotation.x += (this.peerState.targetRotation.x - this.peerState.rotation.x) * effectiveSmoothing;
      this.peerState.rotation.y += (this.peerState.targetRotation.y - this.peerState.rotation.y) * effectiveSmoothing;
      this.peerState.rotation.z += (this.peerState.targetRotation.z - this.peerState.rotation.z) * effectiveSmoothing;
    }

    // Apply to mesh
    this.mesh.position.copyFrom(this.peerState.position);
    this.mesh.rotation.copyFrom(this.peerState.rotation);

    // Update animation based on movement (only for ON_GROUND state)
    if (this.peerState.state === 'ON_GROUND') {
      const currentDistance = Vector3.Distance(previousPosition, this.peerState.position);
      const isCurrentlyMoving = currentDistance > 0.001; // Small threshold for movement detection
      
      // Check if animation needs to change based on movement
      const walkAnimationPlaying = this.animationGroups.walk?.isPlaying || false;
      const idleAnimationPlaying = this.animationGroups.idle?.isPlaying || false;
      
      if (isCurrentlyMoving && !walkAnimationPlaying) {
        // Start walk animation
        this.animationGroups.idle?.stop();
        this.animationGroups.walk?.play(true);
      } else if (!isCurrentlyMoving && !idleAnimationPlaying) {
        // Start idle animation
        this.animationGroups.walk?.stop();
        this.animationGroups.idle?.play(true);
      }
    }
  }

  public dispose(): void {
    // Stop and dispose animations first
    if (this.animationGroups.walk) {
      this.animationGroups.walk.stop();
      this.animationGroups.walk = null;
    }
    if (this.animationGroups.idle) {
      this.animationGroups.idle.stop();
      this.animationGroups.idle = null;
    }

    // Dispose particle system
    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }

    // Dispose mesh last (this will also dispose any child meshes)
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }

    logger.info(`RemotePeer ${this.peerState.id} disposed`, {
      context: 'RemotePeer',
      tag: 'mp'
    });
  }
}
