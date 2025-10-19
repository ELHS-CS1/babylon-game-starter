// ============================================================================
// REMOTE PEER STATE UPDATE SERVICE PROVIDER - Central handler for remote peer updates
// ============================================================================

import type { Scene, Mesh } from '@babylonjs/core';
import { Vector3, ImportMeshAsync } from '@babylonjs/core';
import { RemotePeer } from '../game/RemotePeer';
import { NodeMaterialManager } from '../game/NodeMaterialManager';
import { EffectsManager } from '../game/EffectsManager';
import { logger } from '../utils/logger';
import CONFIG, { ASSETS } from '../config/gameConfig';
import type { Player } from '../types/player';

// Interface for mesh metadata to ensure type safety
interface MeshMetadata {
  isLocal: boolean;
}

export class RemotePeerStateUpdateServiceProvider {
  private static instance: RemotePeerStateUpdateServiceProvider | null = null;
  private scene: Scene | null = null;
  private remotePeers: Map<string, RemotePeer> = new Map();
  private creatingPeers: Set<string> = new Set(); // Track peers being created to prevent duplicates
  private defaultCharacter: any;
  private interpolationIntervalId: number | null = null;
  private staleCheckIntervalId: number | null = null;
  private readonly INTERPOLATION_INTERVAL_MS = 16; // ~60 FPS
  private readonly STALE_CHECK_INTERVAL_MS = 1000; // Check for stale peers every second

  private constructor() {
    this.defaultCharacter = ASSETS.CHARACTERS[0];
    logger.info('RemotePeerStateUpdateServiceProvider initialized', {
      context: 'RemotePeerStateUpdateServiceProvider'
    });
  }

  public static getInstance(): RemotePeerStateUpdateServiceProvider {
    if (!RemotePeerStateUpdateServiceProvider.instance) {
      RemotePeerStateUpdateServiceProvider.instance = new RemotePeerStateUpdateServiceProvider();
    }
    return RemotePeerStateUpdateServiceProvider.instance;
  }

  public initialize(scene: Scene): void {
    this.scene = scene;
    this.startInterpolation();
    this.startStaleCheck();
    logger.info('🎮 RemotePeerStateUpdateServiceProvider initialized with scene', {
      context: 'RemotePeerStateUpdateServiceProvider',
      tag: 'mp',
      sceneExists: !!this.scene,
      sceneMeshes: this.scene?.meshes?.length || 0
    });
  }

  private startInterpolation(): void {
    if (this.interpolationIntervalId !== null) {
      return;
    }

    this.interpolationIntervalId = window.setInterval(() => {
      const deltaTime = this.INTERPOLATION_INTERVAL_MS / 1000;
      this.remotePeers.forEach(peer => {
        peer.interpolate(deltaTime);
      });
    }, this.INTERPOLATION_INTERVAL_MS);
  }

  private startStaleCheck(): void {
    if (this.staleCheckIntervalId !== null) {
      return;
    }

    this.staleCheckIntervalId = window.setInterval(() => {
      this.checkForStalePeers();
    }, this.STALE_CHECK_INTERVAL_MS);
  }

  // Main entry point for handling remote peer updates
  public async handlePeerUpdate(peerData: Player | Partial<Player>): Promise<void> {
    logger.info('🎮 handlePeerUpdate called', {
      context: 'RemotePeerStateUpdateServiceProvider',
      tag: 'mp',
      peerId: peerData.id,
      sceneExists: !!this.scene,
      remotePeersCount: this.remotePeers.size
    });

    if (!peerData.id) {
      logger.warn('Received peer update without id', {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp'
      });
      return;
    }

    // Filter out local peer - don't create remote representation for self
    const { dataStarIntegration } = await import('../datastar-integration');
    if (peerData.id === dataStarIntegration.getMyPeerId()) {
      logger.info(`🎮 Skipping local peer: ${peerData.id}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp'
      });
      return;
    }

    const existingPeer = this.remotePeers.get(peerData.id);

    if (existingPeer) {
      // Check if character model changed - only recreate if character is explicitly provided and different
      const currentCharacter = existingPeer.getState().character;
      const newCharacter = peerData.character;
      
      // Only recreate peer if character field is explicitly provided AND it's different from current
      if (newCharacter !== undefined && newCharacter !== currentCharacter) {
        logger.info(`🎮 Character model changed for peer ${peerData.id}: ${currentCharacter} -> ${newCharacter}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp'
        });
        
        // Store current peer state before disposing to preserve position/rotation
        const currentPeerState = existingPeer.getState();
        const preservedPeerData = {
          ...peerData,
          position: currentPeerState.position,
          rotation: currentPeerState.rotation,
          state: currentPeerState.state,
          boostActive: currentPeerState.boostActive
        } as Player;
        
        logger.info(`🎮 Preserved peer state for character change:`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          peerId: peerData.id,
          preservedPosition: preservedPeerData.position,
          preservedRotation: preservedPeerData.rotation,
          preservedState: preservedPeerData.state
        });
        
        // Remove old peer and create new one with new character and preserved state
        this.removePeer(peerData.id);
        this.creatingPeers.add(peerData.id);
        await this.createPeer(preservedPeerData);
        this.creatingPeers.delete(peerData.id);
      } else {
        // Update existing peer - character field not provided or same as current
        logger.debug(`🎮 Updating existing peer: ${peerData.id} (character: ${newCharacter || 'not provided'}, current: ${currentCharacter})`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp'
        });
        existingPeer.updateFromRemoteData(peerData);
      }
    } else if (this.creatingPeers.has(peerData.id)) {
      // Peer is already being created, skip
      logger.info(`🎮 Peer ${peerData.id} is already being created, skipping`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp'
      });
    } else {
      // Create new peer for new peer id
      logger.info(`🎮 NEW PEER DETECTED: ${peerData.id}, creating remote peer`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerData: peerData
      });
      this.creatingPeers.add(peerData.id);
      await this.createPeer(peerData as Player);
      this.creatingPeers.delete(peerData.id);
    }
  }

  private checkForStalePeers(): void {
    const now = Date.now();
    const STALE_THRESHOLD_MS = 10000; // 10 seconds - increased to prevent premature removal due to network drops

    logger.debug(`🎮 Checking for stale peers: ${this.remotePeers.size} total peers`, {
      context: 'RemotePeerStateUpdateServiceProvider',
      tag: 'mp'
    });

    this.remotePeers.forEach((peer, peerId) => {
      const peerState = peer.getState();
      const timeSinceLastUpdate = now - peerState.lastUpdate;

      logger.debug(`🎮 Peer ${peerId} last update: ${timeSinceLastUpdate}ms ago`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerId,
        timeSinceLastUpdate,
        lastUpdate: peerState.lastUpdate,
        now
      });

      if (timeSinceLastUpdate > STALE_THRESHOLD_MS) {
        logger.warn(`🎮 Peer ${peerId} is stale (${timeSinceLastUpdate}ms), removing after ${STALE_THRESHOLD_MS}ms threshold`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          peerId,
          timeSinceLastUpdate,
          threshold: STALE_THRESHOLD_MS
        });
        this.removePeer(peerId);
      } else if (timeSinceLastUpdate > STALE_THRESHOLD_MS * 0.8) {
        // Warning when approaching stale threshold
        logger.warn(`🎮 Peer ${peerId} approaching stale threshold (${timeSinceLastUpdate}ms / ${STALE_THRESHOLD_MS}ms)`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          peerId,
          timeSinceLastUpdate,
          threshold: STALE_THRESHOLD_MS
        });
      }
    });
  }

  private async createPeer(peerData: Player): Promise<void> {
    if (!this.scene) {
      logger.error('❌ Cannot create peer: scene not initialized', {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp'
      });
      return;
    }

    try {
      logger.info(`🎮 NEW MULTIPLAYER PEER: Creating remote peer for ${peerData.name}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerId: peerData.id,
        name: peerData.name,
        sceneExists: !!this.scene,
        sceneMeshes: this.scene?.meshes?.length || 0
      });

      // Create the RemotePeer instance
      const remotePeer = new RemotePeer(peerData.id, peerData.name);
      logger.info(`🎮 RemotePeer instance created`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerId: peerData.id
      });

      // Load character mesh - use peer's character or default
      const characterName = peerData.character || this.defaultCharacter.name;
      const character = ASSETS.CHARACTERS.find(c => c.name === characterName) || this.defaultCharacter;
      logger.info(`🎮 Loading character mesh: ${character.name} from ${character.model}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        characterName: character.name,
        modelUrl: character.model,
        requestedCharacter: characterName,
        peerDataCharacter: peerData.character,
        defaultCharacter: this.defaultCharacter.name,
        fallbackUsed: !peerData.character
      });
      
      const result = await ImportMeshAsync(character.model, this.scene);
      logger.info(`🎮 Mesh import completed`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        meshCount: result.meshes.length,
        animationGroupCount: result.animationGroups.length
      });

      // Process node materials
      await NodeMaterialManager.processImportResult(result);

      if (result.meshes.length === 0) {
        logger.error(`No meshes found for character: ${character.name}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp'
        });
        return;
      }

      // Set up the mesh
      remotePeer.mesh = (result.meshes[0] as Mesh) || null;
      result.meshes.forEach(mesh => {
        const originalScale = mesh.scaling.clone();
        // Use the same scaling approach as local character: CONFIG.ANIMATION.PLAYER_SCALE
        // TODO: Figure out why 1.22x multiplier is needed for remote peers to match expected size
        mesh.scaling.setAll(CONFIG.ANIMATION.PLAYER_SCALE * 1.22);
        mesh.name = `remote_peer_${peerData.id}_${mesh.name}`;
        
        // Mark as remote peer mesh for disposal filtering
        mesh.metadata = mesh.metadata ?? {};
        (mesh.metadata as MeshMetadata).isLocal = false;
        
        logger.info(`🎮 Applied character scale to mesh ${mesh.name}:`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          meshName: mesh.name,
          originalScale: { x: originalScale.x, y: originalScale.y, z: originalScale.z },
          newScale: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
          playerScale: CONFIG.ANIMATION.PLAYER_SCALE,
          characterScale: character.scale
        });
      });

      // Set initial position and rotation
      const initialPos = new Vector3(
        peerData.position.x,
        peerData.position.y + CONFIG.ANIMATION.PLAYER_Y_OFFSET, // Apply same Y offset as local character
        peerData.position.z
      );
      const initialRot = new Vector3(
        peerData.rotation.x,
        peerData.rotation.y,
        peerData.rotation.z
      );

      // Initialize the remote peer's position state to prevent lerping from origin
      remotePeer.initializePosition(initialPos, initialRot);
      
      // Apply position to mesh
      if (remotePeer.mesh) {
        remotePeer.mesh.position = initialPos;
        remotePeer.mesh.rotation = initialRot;
      }

      // Create particle system
      try {
        const particleSystem = await EffectsManager.createParticleSystem(
          "Magic Sparkles",
          remotePeer.mesh || undefined
        );
        if (particleSystem) {
          remotePeer.particleSystem = particleSystem;
          particleSystem.stop();
        }
      } catch (error) {
        logger.error(`Failed to create particle system for peer ${peerData.id}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          error
        });
      }

      // Setup animations
      logger.info(`🎮 Available animations for ${character.name}:`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        animations: result.animationGroups.map(a => a.name),
        expectedWalk: character.animations.walk,
        expectedIdle: character.animations.idle
      });

      remotePeer.animationGroups.walk =
        result.animationGroups.find(a => a.name === character.animations.walk) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('walk')) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('run')) ||
        null;

      remotePeer.animationGroups.idle =
        result.animationGroups.find(a => a.name === character.animations.idle) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('idle')) ||
        null;

      logger.info(`🎮 Animation setup for ${character.name}:`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        walkAnimation: remotePeer.animationGroups.walk?.name || 'NOT FOUND',
        idleAnimation: remotePeer.animationGroups.idle?.name || 'NOT FOUND'
      });

      // Start with idle animation
      if (remotePeer.animationGroups.idle) {
        remotePeer.animationGroups.idle.play(true);
        logger.info(`🎮 Started idle animation: ${remotePeer.animationGroups.idle.name}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp'
        });
      } else {
        logger.warn(`🎮 No idle animation found for ${character.name}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'mp',
          availableAnimations: result.animationGroups.map(a => a.name)
        });
      }

      // Update peer with initial data
      remotePeer.updateFromRemoteData(peerData);

      // Store the peer
      this.remotePeers.set(peerData.id, remotePeer);

      logger.info(`✅ Remote peer created successfully: ${peerData.name}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerId: peerData.id,
        meshExists: !!remotePeer.mesh,
        meshName: remotePeer.mesh?.name,
        meshPosition: remotePeer.mesh?.position,
        totalRemotePeers: this.remotePeers.size
      });
    } catch (error) {
      logger.error(`❌ Failed to create remote peer ${peerData.name}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp',
        peerId: peerData.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  public removePeer(peerId: string): void {
    const peer = this.remotePeers.get(peerId);
    if (peer) {
      peer.dispose();
      this.remotePeers.delete(peerId);
      logger.info(`Removed remote peer: ${peerId}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'mp'
      });
    }
  }

  public getPeer(peerId: string): RemotePeer | undefined {
    return this.remotePeers.get(peerId);
  }

  public getAllPeers(): RemotePeer[] {
    return Array.from(this.remotePeers.values());
  }

  public dispose(): void {
    // Stop interpolation
    if (this.interpolationIntervalId !== null) {
      window.clearInterval(this.interpolationIntervalId);
      this.interpolationIntervalId = null;
    }

    // Stop stale check
    if (this.staleCheckIntervalId !== null) {
      window.clearInterval(this.staleCheckIntervalId);
      this.staleCheckIntervalId = null;
    }

    // Dispose all peers
    this.remotePeers.forEach(peer => { peer.dispose(); });
    this.remotePeers.clear();

    this.scene = null;

    logger.info('RemotePeerStateUpdateServiceProvider disposed', {
      context: 'RemotePeerStateUpdateServiceProvider',
      tag: 'mp'
    });
  }
}

export const remotePeerStateUpdateService = RemotePeerStateUpdateServiceProvider.getInstance();
