// ============================================================================
// PEER RENDERER - Handles rendering of remote peer characters
// ============================================================================

import type { Scene, Mesh, AnimationGroup} from '@babylonjs/core';
import { Vector3, StandardMaterial, Color3, type IParticleSystem, Quaternion } from '@babylonjs/core';
import { ImportMeshAsync } from '@babylonjs/core';
import { NodeMaterialManager } from './NodeMaterialManager';
import { EffectsManager } from './EffectsManager';
import { logger } from '../utils/logger';
import { ASSETS } from '../config/gameConfig';
import type { Player } from '../state';

export interface PeerCharacter {
  id: string;
  name: string;
  mesh: Mesh | null;
  position: Vector3;
  rotation: Vector3;
  targetPosition: Vector3;
  targetRotation: Vector3;
  isMoving: boolean;
  lastUpdate: number;
  boostActive: boolean;
  state: string;
  particleSystem: IParticleSystem | null;
  animationGroups: {
    walk: AnimationGroup | null;
    idle: AnimationGroup | null;
  };
}

export class PeerRenderer {
  private scene: Scene;
  private peerCharacters: Map<string, PeerCharacter> = new Map();
  private defaultCharacter: any;

  constructor(scene: Scene) {
    this.scene = scene;
    this.defaultCharacter = ASSETS.CHARACTERS[0]; // Use first character as default
    logger.info('PeerRenderer initialized', { context: 'PeerRenderer', tag: 'init' });
  }

  public async createPeerCharacter(peer: Player): Promise<void> {
    if (this.peerCharacters.has(peer.id)) {
      logger.warn(`Peer character already exists: ${peer.id}`, { context: 'PeerRenderer', tag: 'create' });
      return;
    }

    try {
      logger.info(`Creating peer character for: ${peer.name} (${peer.id})`, { context: 'PeerRenderer', tag: 'create' });

      // Use default character model for all peers (can be enhanced later)
      const character = this.defaultCharacter;
      
      // Import the character mesh
      const result = await ImportMeshAsync(character.model, this.scene);
      
      // Process node materials
      await NodeMaterialManager.processImportResult(result);

      if (result.meshes.length === 0) {
        logger.error(`No meshes found for character: ${character.name}`, { context: 'PeerRenderer', tag: 'create' });
        return;
      }

      // Create peer character data
      const peerCharacter: PeerCharacter = {
        id: peer.id,
        name: peer.name,
        mesh: result.meshes[0],
        position: new Vector3(peer.position.x, peer.position.y, peer.position.z),
        rotation: new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z),
        targetPosition: new Vector3(peer.position.x, peer.position.y, peer.position.z),
        targetRotation: new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z),
        isMoving: false,
        lastUpdate: peer.lastUpdate,
        boostActive: peer.boostActive || false,
        state: peer.state || 'idle',
        particleSystem: null,
        animationGroups: {
          walk: null,
          idle: null
        }
      };

      // Apply character scale and position
      result.meshes.forEach(mesh => {
        mesh.scaling.setAll(character.scale);
        mesh.name = `peer_${peer.id}_${mesh.name}`;
      });

      // Set initial position
      peerCharacter.mesh.position = peerCharacter.position;
      peerCharacter.mesh.rotation = peerCharacter.rotation;

      // Create boost particle system for this peer
      try {
        const particleSystem = await EffectsManager.createParticleSystem("Magic Sparkles", peerCharacter.mesh);
        if (particleSystem) {
          peerCharacter.particleSystem = particleSystem;
          // Initially stop the particle system
          particleSystem.stop();
          logger.info(`Created boost particle system for peer ${peer.id}`, { context: 'PeerRenderer', tag: 'particles' });
        }
      } catch (error) {
        logger.error(`Failed to create particle system for peer ${peer.id}:`, { context: 'PeerRenderer', tag: 'particles', error });
      }

      // Setup animations
      peerCharacter.animationGroups.walk = result.animationGroups.find(a => a.name === character.animations.walk) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('walk')) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('run')) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('move'));

      peerCharacter.animationGroups.idle = result.animationGroups.find(a => a.name === character.animations.idle) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('idle')) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('stand'));

      // Start with idle animation
      if (peerCharacter.animationGroups.idle) {
        peerCharacter.animationGroups.idle.play(true);
      }

      // Store the peer character
      this.peerCharacters.set(peer.id, peerCharacter);

      logger.info(`✅ Peer character created: ${peer.name}`, { context: 'PeerRenderer', tag: 'create' });

    } catch (error) {
      logger.error(`Failed to create peer character for ${peer.name}:`, { context: 'PeerRenderer', tag: 'create', error });
    }
  }

  public updatePeerPosition(peerId: string, position: Vector3, rotation: Vector3, boostActive?: boolean, state?: string): void {
    const peerCharacter = this.peerCharacters.get(peerId);
    if (!peerCharacter?.mesh) {
      return;
    }

    // Update target positions for smooth interpolation
    peerCharacter.targetPosition = position.clone();
    peerCharacter.targetRotation = rotation.clone();
    peerCharacter.isMoving = true;
    peerCharacter.lastUpdate = Date.now();

    // Update boost state and particle system
    if (typeof boostActive === 'boolean' && peerCharacter.boostActive !== boostActive) {
      peerCharacter.boostActive = boostActive;
      this.updatePeerParticleSystem(peerCharacter);
      logger.info(`Updated peer ${peerId} boost state: ${boostActive}`, { context: 'PeerRenderer', tag: 'boost' });
    }

    // Update character state
    if (typeof state === 'string') {
      peerCharacter.state = state;
    }

    // Determine if character is moving (for animation)
    const distance = Vector3.Distance(peerCharacter.position, peerCharacter.targetPosition);
    const isActuallyMoving = distance > 0.1;

    if (isActuallyMoving && peerCharacter.animationGroups.walk) {
      // Switch to walk animation
      if (peerCharacter.animationGroups.idle) {
        peerCharacter.animationGroups.idle.stop();
      }
      peerCharacter.animationGroups.walk.play(true);
    } else if (!isActuallyMoving && peerCharacter.animationGroups.idle) {
      // Switch to idle animation
      if (peerCharacter.animationGroups.walk) {
        peerCharacter.animationGroups.walk.stop();
      }
      peerCharacter.animationGroups.idle.play(true);
    }
  }

  private updatePeerParticleSystem(peerCharacter: PeerCharacter): void {
    if (!peerCharacter.particleSystem) {
      return;
    }

    if (peerCharacter.boostActive) {
      peerCharacter.particleSystem.start();
    } else {
      peerCharacter.particleSystem.stop();
    }
  }

  public updatePeerInterpolation(deltaTime: number): void {
    // Use deltaTime-based interpolation for frame-rate independent smooth movement
    const positionLerpSpeed = Math.min(1.0, deltaTime * 8.0); // 8x speed multiplier
    const rotationLerpSpeed = Math.min(1.0, deltaTime * 6.0); // 6x speed multiplier for smoother rotation

    this.peerCharacters.forEach((peerCharacter) => {
      if (!peerCharacter.mesh) return;

      // Interpolate position using LERP
      Vector3.LerpToRef(
        peerCharacter.mesh.position,
        peerCharacter.targetPosition,
        positionLerpSpeed,
        peerCharacter.mesh.position
      );

      // Interpolate rotation using SLERP (Spherical Linear Interpolation)
      // Convert Euler rotations to quaternions for proper SLERP
      const currentQuat = Quaternion.FromEulerAngles(
        peerCharacter.mesh.rotation.x,
        peerCharacter.mesh.rotation.y,
        peerCharacter.mesh.rotation.z
      );
      
      const targetQuat = Quaternion.FromEulerAngles(
        peerCharacter.targetRotation.x,
        peerCharacter.targetRotation.y,
        peerCharacter.targetRotation.z
      );

      // Perform SLERP
      const interpolatedQuat = Quaternion.Slerp(currentQuat, targetQuat, rotationLerpSpeed);
      
      // Convert back to Euler angles
      const eulerAngles = interpolatedQuat.toEulerAngles();
      peerCharacter.mesh.rotation.set(eulerAngles.x, eulerAngles.y, eulerAngles.z);

      // Update stored position and rotation
      peerCharacter.position = peerCharacter.mesh.position.clone();
      peerCharacter.rotation = peerCharacter.mesh.rotation.clone();
    });
  }

  public removePeerCharacter(peerId: string): void {
    const peerCharacter = this.peerCharacters.get(peerId);
    if (!peerCharacter) {
      return;
    }

    logger.info(`Removing peer character: ${peerCharacter.name} (${peerId})`, { context: 'PeerRenderer', tag: 'remove' });

    // Stop animations
    if (peerCharacter.animationGroups.walk) {
      peerCharacter.animationGroups.walk.stop();
    }
    if (peerCharacter.animationGroups.idle) {
      peerCharacter.animationGroups.idle.stop();
    }

    // Dispose particle system
    if (peerCharacter.particleSystem) {
      peerCharacter.particleSystem.dispose();
    }

    // Dispose mesh
    if (peerCharacter.mesh) {
      peerCharacter.mesh.dispose();
    }

    // Remove from map
    this.peerCharacters.delete(peerId);

    logger.info(`✅ Peer character removed: ${peerCharacter.name}`, { context: 'PeerRenderer', tag: 'remove' });
  }

  public clearAllPeerCharacters(): void {
    logger.info('Clearing all peer characters', { context: 'PeerRenderer', tag: 'clear' });

    this.peerCharacters.forEach((peerCharacter, peerId) => {
      this.removePeerCharacter(peerId);
    });

    this.peerCharacters.clear();
    logger.info('✅ All peer characters cleared', { context: 'PeerRenderer', tag: 'clear' });
  }

  public getPeerCharacter(peerId: string): PeerCharacter | undefined {
    return this.peerCharacters.get(peerId);
  }

  public getAllPeerCharacters(): Map<string, PeerCharacter> {
    return this.peerCharacters;
  }

  public dispose(): void {
    this.clearAllPeerCharacters();
    logger.info('PeerRenderer disposed', { context: 'PeerRenderer', tag: 'dispose' });
  }
}
