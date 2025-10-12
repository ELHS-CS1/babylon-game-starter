// ============================================================================
// GAME ENGINE - FOLLOWING THE WORD OF THE LORD FROM PLAYGROUND.TS
// ============================================================================

import type { Mesh, Scene } from '@babylonjs/core';
import { Engine, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
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
  // Remote players removed - using default Babylon.js render loop like the playground
  private currentEnvironment: string = 'Level Test';
  // Removed custom render loop variables - using default Babylon.js render loop
   
  public onPeerUpdate?: () => void;

  // Update current environment and notify peer manager
  public setEnvironmentInitial(environment: string): void {
    this.currentEnvironment = environment;
    this.peerManager.setCurrentEnvironment(environment);
    logger.info(`Environment changed to: ${environment}`, { context: 'GameEngine', tag: 'environment' });
  }

  constructor(canvas: HTMLCanvasElement, environment: string = 'Level Test') {
    logger.info(`GameEngine constructor called with environment: ${environment}`, 'GameEngine');
    
    // this.canvas = canvas; // Unused for now
    this.currentEnvironment = environment;
    this.peerManager = new PeerManager();
    
            // Initialize Babylon.js engine like the playground - THE WORD OF THE LORD!
            this.engine = new Engine(canvas, false);
    
    logger.info("Babylon.js engine created with performance optimizations", 'GameEngine');
    
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
    // Use the default Babylon.js render loop like the playground - THE WORD OF THE LORD!
    if (this.sceneManager) {
      this.engine.runRenderLoop(() => {
        this.sceneManager!.getScene().render();
      });
    }
  }

  // Update method removed - using default Babylon.js render loop like the playground

  // HUD updates removed - using default Babylon.js render loop like the playground

  // Remote player updates removed - using default Babylon.js render loop like the playground

  // createPlayerMesh method removed - using default Babylon.js render loop like the playground

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
      
      // 4. UPDATE PEER ENVIRONMENT AND NOTIFY SERVER
      const localPeer = this.peerManager.getLocalPeer();
      if (localPeer) {
        localPeer.environment = environment;
        
        // Notify server about environment change
        this.notifyEnvironmentChange(environment);
      }
      
      // 5. UPDATE PEER MANAGER (this will request peers from new environment)
      this.peerManager.setCurrentEnvironment(environment);
    }
  }

  private notifyEnvironmentChange(environment: string): void {
    logger.info(`🌍 Notifying server of environment change to: ${environment}`, { context: 'GameEngine', tag: 'environment' });
    
    // Import DataStar integration to send the environment change notification
    import('../datastar-integration').then(({ dataStarIntegration }) => {
      dataStarIntegration.send({
        type: 'environmentChange',
        environment: environment,
        timestamp: Date.now()
      });
    }).catch(error => {
      logger.error('Failed to import DataStar integration:', { context: 'GameEngine', tag: 'environment', error });
    });
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
    // Dispose SceneManager from THE WORD OF THE LORD
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
    
    this.engine.dispose();
  }
}