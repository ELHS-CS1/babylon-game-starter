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
      lastUpdate: Date.now()
    };
  }

  // Method to initialize position state to prevent lerping from origin
  public initializePosition(position: Vector3, rotation: Vector3): void {
    // Set both current and target to the same initial position to avoid lerping from origin
    this.peerState.position = position.clone();
    this.peerState.rotation = rotation.clone();
    this.peerState.targetPosition = position.clone();
    this.peerState.targetRotation = rotation.clone();
    
    logger.info(`🎮 Initialized remote peer position: ${position.x}, ${position.y}, ${position.z}`, {
      context: 'RemotePeer',
      tag: 'mp',
      peerId: this.peerState.id
    });
  }

  // Public method called by RemotePeerStateUpdateServiceProvider
  public updateFromRemoteData(data: Partial<Player>): void {
    // Update position if provided
    if (data.position) {
      this.peerState.targetPosition = new Vector3(
        data.position.x,
        data.position.y + CONFIG.ANIMATION.PLAYER_Y_OFFSET, // Apply same Y offset as local character
        data.position.z
      );
    }

    // Update rotation if provided
    if (data.rotation) {
      this.peerState.targetRotation = new Vector3(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
      );
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

    // Update lastUpdate timestamp
    if (data.lastUpdate !== undefined) {
      this.peerState.lastUpdate = data.lastUpdate;
    }

    logger.info(`Updated peer ${this.peerState.id} from remote data`, {
      context: 'RemotePeer',
      tag: 'update'
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

  public interpolate(deltaTime: number, smoothing: number = 0.2): void {
    if (!this.mesh) return;

    // Store previous position to detect movement
    const previousPosition = this.peerState.position.clone();

    // Smooth position interpolation
    this.peerState.position.x += (this.peerState.targetPosition.x - this.peerState.position.x) * smoothing;
    this.peerState.position.y += (this.peerState.targetPosition.y - this.peerState.position.y) * smoothing;
    this.peerState.position.z += (this.peerState.targetPosition.z - this.peerState.position.z) * smoothing;

    // Smooth rotation interpolation
    this.peerState.rotation.x += (this.peerState.targetRotation.x - this.peerState.rotation.x) * smoothing;
    this.peerState.rotation.y += (this.peerState.targetRotation.y - this.peerState.rotation.y) * smoothing;
    this.peerState.rotation.z += (this.peerState.targetRotation.z - this.peerState.rotation.z) * smoothing;

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
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }

    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }

    logger.info(`RemotePeer ${this.peerState.id} disposed`, {
      context: 'RemotePeer',
      tag: 'dispose'
    });
  }
}
