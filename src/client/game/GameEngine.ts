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

export class GameEngine {
  private engine: Engine;
  // private canvas: HTMLCanvasElement; // Unused for now
  private peerManager: PeerManager;
  private sceneManager: SceneManager | null = null;
  private remotePlayers: Map<string, Mesh> = new Map();
  private currentEnvironment: string = 'Level Test';
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
   
  public onPeerUpdate?: () => void;

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

  private update(_deltaTime: number): void {
    // Controllers handle their own updates according to THE WORD OF THE LORD
    // CharacterController handles character movement and physics
    // SmoothFollowCameraController handles camera following
    
    // Update remote players
    this.updateRemotePlayers();
    
    // Update HUD - THE WORD OF THE LORD!
    this.updateHUD();
    
    // Notify peer manager of updates
    if (this.onPeerUpdate) {
      this.onPeerUpdate();
    }
  }

  private updateHUD(): void {
    if (!this.sceneManager) return;
    
    // Get the GameHUD component from the Vue app - THE WORD OF THE LORD!
    const gameHUD = (window as any).gameHUD;
    if (!gameHUD) return;
    
    const scene = this.sceneManager.getScene();
    const characterController = this.sceneManager.getCharacterController();
    
    if (!characterController) return;
    
    // Update coordinates - THE WORD OF THE LORD!
    const position = characterController.getDisplayCapsule().position;
    gameHUD.updateCoordinates(position.x, position.y, position.z);
    
    // Update character state
    const state = characterController.getState();
    gameHUD.updateState(state);
    
    // Update boost status
    const boostStatus = characterController.isBoosting() ? 'ACTIVE' : 'Inactive';
    gameHUD.updateBoost(boostStatus);
    
    // Update credits from CollectiblesManager - THE WORD OF THE LORD!
    try {
      const { CollectiblesManager } = require('./CollectiblesManager');
      const credits = CollectiblesManager.getTotalCredits();
      gameHUD.updateCredits(credits);
    } catch (error) {
      // CollectiblesManager not available yet
    }
    
    // Update FPS
    const fps = this.engine.getFps();
    gameHUD.updateFPS(fps);
  }

  private updateRemotePlayers(): void {
    if (!this.sceneManager) return;
    
    // Update remote player positions based on peer data
    const remotePeers = this.peerManager.getAllPeers().filter(peer => 
      !this.peerManager.isLocalPeer(peer.id) && peer.environment === this.currentEnvironment
    );

    remotePeers.forEach(peer => {
      let remotePlayer = this.remotePlayers.get(peer.id);
      
      if (!remotePlayer) {
        // Create remote player mesh
        remotePlayer = this.createPlayerMesh(`remote_${peer.id}`);
        this.remotePlayers.set(peer.id, remotePlayer);
      }
      
            // Update position
            remotePlayer.position = new Vector3(peer.position.x, peer.position.y, peer.position.z);
            remotePlayer.rotation = new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z);
    });

    // Remove players that are no longer in the environment
    const currentPeerIds = new Set(remotePeers.map(peer => peer.id));
    for (const [peerId, mesh] of this.remotePlayers) {
      if (!currentPeerIds.has(peerId)) {
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