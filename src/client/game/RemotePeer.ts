// ============================================================================
// REMOTE PEER - Individual remote peer state management
// ============================================================================

import { Vector3, type Mesh, type AnimationGroup, type IParticleSystem } from '@babylonjs/core';
import type { Player } from '../types/player';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/gameConfig';

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
      this.peerState.state = data.state;
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
