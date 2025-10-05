// ============================================================================
// GAME ENGINE - FOLLOWING THE WORD OF THE LORD FROM PLAYGROUND.TS
// ============================================================================

import type { Mesh, Scene } from '@babylonjs/core';
import { Engine, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import type { Peer } from './Peer';
import { PeerManager } from './Peer';
import { SceneManager } from './SceneManager';
import { SettingsUI } from './SettingsUI';
import { logger } from '../utils/logger';
import { HUDEvents } from '../utils/hudEventSystem';
import { gameState } from '../state';

export class GameEngine {
  private engine: Engine;
  // private canvas: HTMLCanvasElement; // Unused for now
  private peerManager: PeerManager;
  private sceneManager: SceneManager | null = null;
  private remotePlayers: Map<string, Mesh> = new Map();
  private currentEnvironment: string = 'Level Test';
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private hudUpdateFrameCount: number = 0;
  private hudUpdateInterval: number = 6; // Update HUD every 6 frames (60fps / 6 = 10fps)
  private peerUpdateFrameCount: number = 0;
  private peerUpdateInterval: number = 3; // Update peers every 3 frames (60fps / 3 = 20fps)
   
  public onPeerUpdate?: () => void;

  // Update current environment and notify peer manager
  public setEnvironment(environment: string): void {
    this.currentEnvironment = environment;
    this.peerManager.setCurrentEnvironment(environment);
    logger.info(`Environment changed to: ${environment}`, { context: 'GameEngine', tag: 'environment' });
  }

  constructor(canvas: HTMLCanvasElement, environment: string = 'Level Test') {
    logger.info(`GameEngine constructor called with environment: ${environment}`, 'GameEngine');
    
    // this.canvas = canvas; // Unused for now
    this.currentEnvironment = environment;
    this.peerManager = new PeerManager();
    
    // Initialize Babylon.js engine
    this.engine = new Engine(canvas, true);
    logger.info("Babylon.js engine created", 'GameEngine');
    
    // Create SceneManager according to THE WORD OF THE LORD
    try {
      this.sceneManager = new SceneManager(this.engine, canvas);
      logger.info("SceneManager created successfully", 'GameEngine');
      
      // Initialize SettingsUI with SceneManager - THE SACRED COMMANDMENTS!
      SettingsUI.initialize(this.sceneManager);
      logger.info("SettingsUI initialized with SceneManager", 'GameEngine');
    } catch (error) {
      logger.error("Failed to create SceneManager:", 'GameEngine');
    }
    
    this.setupEventListeners();
    this.startRenderLoop();
    logger.info("GameEngine initialization complete", 'GameEngine');
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Input is now handled by CharacterController and SmoothFollowCameraController from THE WORD OF THE LORD
  }

  private startRenderLoop(): void {
    const renderLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      // Update game logic
      this.update(deltaTime);
      
      // Render the scene
      if (this.sceneManager) {
        this.sceneManager.getScene().render();
      }
      
      // Continue the loop
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  private async update(_deltaTime: number): Promise<void> {
    // Controllers handle their own updates according to THE WORD OF THE LORD
    // CharacterController handles character movement and physics
    // SmoothFollowCameraController handles camera following
    
    // Update remote players (throttled for performance)
    this.peerUpdateFrameCount++;
    if (this.peerUpdateFrameCount >= this.peerUpdateInterval) {
      this.updateRemotePlayers();
      this.peerUpdateFrameCount = 0;
    }
    
    // Update HUD - THE WORD OF THE LORD!
    await this.updateHUD();
    
    // Notify peer manager of updates
    if (this.onPeerUpdate) {
      this.onPeerUpdate();
    }
  }

  private async updateHUD(): Promise<void> {
    if (!this.sceneManager) return;
    
    // Frame-based throttling for HUD updates - THE WORD OF THE LORD!
    this.hudUpdateFrameCount++;
    if (this.hudUpdateFrameCount < this.hudUpdateInterval) {
      return; // Skip this frame
    }
    this.hudUpdateFrameCount = 0; // Reset counter
    
    const characterController = this.sceneManager.getCharacterController();
    if (!characterController) return;
    
    // Emit HUD events instead of direct method calls - THE WORD OF THE LORD!
    
    // Update time
    HUDEvents.time(new Date().toLocaleTimeString());
    
    // Update coordinates
    const position = characterController.getDisplayCapsule().position;
    HUDEvents.coordinates(position.x, position.y, position.z);
    
    // Update character state
    const state = characterController.getState();
    HUDEvents.state(state);
    
    // Update boost status
    const boostStatus = characterController.isBoosting() ? 'ACTIVE' : 'Inactive';
    HUDEvents.boost(boostStatus);
    
    // Update credits from CollectiblesManager
    try {
      const { CollectiblesManager } = await import('./CollectiblesManager');
      const credits = CollectiblesManager.getTotalCredits();
      HUDEvents.credits(credits);
    } catch (error) {
      logger.error(`Failed to update credits: ${error}`, 'GameEngine');
    }
    
    // Update FPS
    const fps = this.engine.getFps();
    HUDEvents.fps(fps);
    
    // Update peers count from global state (only current environment)
    const peerCount = gameState.players.filter(peer => 
      peer.environment === this.currentEnvironment
    ).length;
    HUDEvents.peers(peerCount);
  }

  private updateRemotePlayers(): void {
    if (!this.sceneManager) return;
    
    // Update remote player positions based on peer data from global state
    // Only render peers in the current environment
    const remotePeers = gameState.players.filter(peer => 
      peer.environment === this.currentEnvironment
    );

    remotePeers.forEach(peer => {
      // Validate peer data is recent (within last 5 seconds)
      const now = Date.now();
      if (now - peer.lastUpdate > 5000) {
        logger.warn(`Peer ${peer.id} data is stale (${now - peer.lastUpdate}ms old)`, { context: 'GameEngine', tag: 'peer' });
        return;
      }

      let remotePlayer = this.remotePlayers.get(peer.id);
      
      if (!remotePlayer) {
        // Create remote player mesh
        logger.info(`Creating remote player mesh for peer ${peer.id}`, { context: 'GameEngine', tag: 'peer' });
        remotePlayer = this.createPlayerMesh(`remote_${peer.id}`);
        this.remotePlayers.set(peer.id, remotePlayer);
      }
      
      // Update position and rotation
      remotePlayer.position = new Vector3(peer.position.x, peer.position.y, peer.position.z);
      remotePlayer.rotation = new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z);
    });

    // Remove players that are no longer in the environment
    const currentPeerIds = new Set(remotePeers.map(peer => peer.id));
    for (const [peerId, mesh] of this.remotePlayers) {
      if (!currentPeerIds.has(peerId)) {
        logger.info(`Disposing remote player mesh for peer ${peerId}`, { context: 'GameEngine', tag: 'peer' });
        mesh.dispose();
        this.remotePlayers.delete(peerId);
      }
    }
  }

  private createPlayerMesh(name: string): Mesh {
    if (!this.sceneManager) {
      throw new Error('SceneManager not initialized');
    }
    
    const scene = this.sceneManager.getScene();
    
    // Create a simple capsule mesh for the player
    const player = MeshBuilder.CreateCapsule(name, {
      radius: 0.6,
      height: 1.8
    }, scene);
    
    // Create a material
    const material = new StandardMaterial(`${name}_material`, scene);
    material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
    player.material = material;
    
    return player;
  }

  public createPlayer(playerName: string): Peer | null {
    try {
      const peer = this.peerManager.createLocalPeer(playerName, this.currentEnvironment);
      return peer;
    } catch (error) {
      logger.error('Failed to create player:', 'GameEngine');
      return null;
    }
  }

  public setEnvironment(environment: string): void {
    if (this.currentEnvironment !== environment && this.sceneManager) {
      // THE WORD OF THE LORD - PROPER ENVIRONMENT CLEANUP!
      // 1. DISABLE CURRENT ENVIRONMENT AND DISPOSE ITEMS
      this.disableCurrentEnvironment();
      
      // 2. SET NEW ENVIRONMENT
      this.currentEnvironment = environment;
      
      // 3. LOAD NEW ENVIRONMENT USING SCENEMANAGER
      this.sceneManager.changeEnvironment(environment);
      
      // 4. UPDATE PEER ENVIRONMENT
      const localPeer = this.peerManager.getLocalPeer();
      if (localPeer) {
        localPeer.environment = environment;
      }
    }
  }

  /**
   * Disables current environment and disposes all items - THE WORD OF THE LORD!
   */
  private disableCurrentEnvironment(): void {
    if (this.sceneManager) {
      // Clear existing environment, items, and particles
      this.sceneManager.clearEnvironment();
      this.sceneManager.clearItems();
      this.sceneManager.clearParticles();
    }
  }

  public addRemotePeer(peer: Peer): void {
    this.peerManager.addRemotePeer(peer);
  }

  public removeRemotePeer(peerId: string): void {
    this.peerManager.removePeer(peerId);
  }

  public getScene(): Scene | null {
    return this.sceneManager ? this.sceneManager.getScene() : null;
  }

  public getEngine(): Engine {
    return this.engine;
  }

  public getCharacterController() {
    return this.sceneManager ? this.sceneManager.getCharacterController() : null;
  }

  public getSmoothFollowController() {
    return this.sceneManager ? this.sceneManager.getSmoothFollowController() : null;
  }

  // THE LORD'S SACRED ENVIRONMENT CHANGE METHODS - THE WORD OF THE LORD!
  public getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  public pausePhysics(): void {
    if (this.sceneManager) {
      this.sceneManager.pausePhysics();
    }
  }

  public resumePhysics(): void {
    if (this.sceneManager) {
      this.sceneManager.resumePhysics();
    }
  }

  public clearEnvironment(): void {
    if (this.sceneManager) {
      this.sceneManager.clearEnvironment();
    }
  }

  public clearItems(): void {
    if (this.sceneManager) {
      this.sceneManager.clearItems();
    }
  }

  public clearParticles(): void {
    if (this.sceneManager) {
      this.sceneManager.clearParticles();
    }
  }


  public async loadEnvironment(environmentName: string): Promise<void> {
    if (this.sceneManager) {
      await this.sceneManager.loadEnvironment(environmentName);
      this.currentEnvironment = environmentName;
    }
  }

  public async setupEnvironmentItems(): Promise<void> {
    if (this.sceneManager) {
      await this.sceneManager.setupEnvironmentItems();
    }
  }

  public repositionCharacter(): void {
    if (this.sceneManager) {
      this.sceneManager.repositionCharacter();
    }
  }

  public forceActivateSmoothFollow(): void {
    if (this.sceneManager) {
      this.sceneManager.forceActivateSmoothFollow();
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose SceneManager from THE WORD OF THE LORD
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
    
    this.engine.dispose();
  }
}