// ============================================================================
// REMOTE PEER STATE UPDATE SERVICE PROVIDER - Central handler for remote peer updates
// ============================================================================

import type { Scene } from '@babylonjs/core';
import { Vector3, ImportMeshAsync } from '@babylonjs/core';
import { RemotePeer } from '../game/RemotePeer';
import { NodeMaterialManager } from '../game/NodeMaterialManager';
import { EffectsManager } from '../game/EffectsManager';
import { logger } from '../utils/logger';
import { ASSETS } from '../config/gameConfig';
import type { Player } from '../types/player';

export class RemotePeerStateUpdateServiceProvider {
  private static instance: RemotePeerStateUpdateServiceProvider | null = null;
  private scene: Scene | null = null;
  private remotePeers: Map<string, RemotePeer> = new Map();
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
    logger.info('RemotePeerStateUpdateServiceProvider initialized with scene', {
      context: 'RemotePeerStateUpdateServiceProvider'
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
    if (!peerData.id) {
      logger.warn('Received peer update without id', {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'update'
      });
      return;
    }

    const existingPeer = this.remotePeers.get(peerData.id);

    if (existingPeer) {
      // Update existing peer
      existingPeer.updateFromRemoteData(peerData);
    } else {
      // Create new peer for new peer id
      logger.info(`New peer id detected: ${peerData.id}, creating remote peer`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'create'
      });
      await this.createPeer(peerData as Player);
    }
  }

  private checkForStalePeers(): void {
    const now = Date.now();
    const STALE_THRESHOLD_MS = 2000; // 2 seconds

    this.remotePeers.forEach((peer, peerId) => {
      const peerState = peer.getState();
      const timeSinceLastUpdate = now - peerState.lastUpdate;

      if (timeSinceLastUpdate > STALE_THRESHOLD_MS) {
        logger.warn(`Peer ${peerId} is stale (${timeSinceLastUpdate}ms), removing`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'stale'
        });
        this.removePeer(peerId);
      }
    });
  }

  private async createPeer(peerData: Player): Promise<void> {
    if (!this.scene) {
      logger.error('Cannot create peer: scene not initialized', {
        context: 'RemotePeerStateUpdateServiceProvider'
      });
      return;
    }

    try {
      logger.info(`Creating remote peer: ${peerData.name} (${peerData.id})`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'create'
      });

      // Create the RemotePeer instance
      const remotePeer = new RemotePeer(peerData.id, peerData.name);

      // Load character mesh
      const character = this.defaultCharacter; // Can be enhanced to support different characters
      const result = await ImportMeshAsync(character.model, this.scene);

      // Process node materials
      await NodeMaterialManager.processImportResult(result);

      if (result.meshes.length === 0) {
        logger.error(`No meshes found for character: ${character.name}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'create'
        });
        return;
      }

      // Set up the mesh
      remotePeer.mesh = result.meshes[0];
      result.meshes.forEach(mesh => {
        mesh.scaling.setAll(character.scale);
        mesh.name = `remote_peer_${peerData.id}_${mesh.name}`;
      });

      // Set initial position and rotation
      const initialPos = new Vector3(
        peerData.position.x,
        peerData.position.y,
        peerData.position.z
      );
      const initialRot = new Vector3(
        peerData.rotation.x,
        peerData.rotation.y,
        peerData.rotation.z
      );

      remotePeer.mesh.position = initialPos;
      remotePeer.mesh.rotation = initialRot;

      // Create particle system
      try {
        const particleSystem = await EffectsManager.createParticleSystem(
          "Magic Sparkles",
          remotePeer.mesh
        );
        if (particleSystem) {
          remotePeer.particleSystem = particleSystem;
          particleSystem.stop();
        }
      } catch (error) {
        logger.error(`Failed to create particle system for peer ${peerData.id}`, {
          context: 'RemotePeerStateUpdateServiceProvider',
          tag: 'particles',
          error
        });
      }

      // Setup animations
      remotePeer.animationGroups.walk =
        result.animationGroups.find(a => a.name === character.animations.walk) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('walk')) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('run'));

      remotePeer.animationGroups.idle =
        result.animationGroups.find(a => a.name === character.animations.idle) ||
        result.animationGroups.find(a => a.name.toLowerCase().includes('idle'));

      // Start with idle animation
      if (remotePeer.animationGroups.idle) {
        remotePeer.animationGroups.idle.play(true);
      }

      // Update peer with initial data
      remotePeer.updateFromRemoteData(peerData);

      // Store the peer
      this.remotePeers.set(peerData.id, remotePeer);

      logger.info(`✅ Remote peer created: ${peerData.name}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'create'
      });
    } catch (error) {
      logger.error(`Failed to create remote peer ${peerData.name}`, {
        context: 'RemotePeerStateUpdateServiceProvider',
        tag: 'create',
        error
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
        tag: 'remove'
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
      context: 'RemotePeerStateUpdateServiceProvider'
    });
  }
}

export const remotePeerStateUpdateService = RemotePeerStateUpdateServiceProvider.getInstance();
