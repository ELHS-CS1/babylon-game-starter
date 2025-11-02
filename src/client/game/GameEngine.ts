// ============================================================================
// GAME ENGINE - FOLLOWING THE WORD OF THE LORD FROM PLAYGROUND.TS
// ============================================================================

import type { Mesh, Scene } from '@babylonjs/core';
import { Engine, WebGPUEngine, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { SettingsUI } from './SettingsUI';
import { logger } from '../utils/logger';

export class GameEngine {
  private static instance: GameEngine | null = null;
  private engine: Engine;
  // private canvas: HTMLCanvasElement; // Unused for now
  private sceneManager: SceneManager | null = null;
  // Remote players removed - using default Babylon.js render loop like the playground
  private currentEnvironment: string = 'Level Test';
  // Removed custom render loop variables - using default Babylon.js render loop
   
  public onPeerUpdate?: () => void;

  // Update current environment
  public setEnvironmentInitial(environment: string): void {
    this.currentEnvironment = environment;
    logger.info(`Environment changed to: ${environment}`, { context: 'GameEngine', tag: 'environment' });
  }

  private constructor(canvas: HTMLCanvasElement, environment: string = 'Level Test') {
    logger.info(`GameEngine constructor called with environment: ${environment}`, 'GameEngine');
    
    // this.canvas = canvas; // Unused for now
    this.currentEnvironment = environment;
    
            // Initialize Babylon.js engine with WebGL2 - THE WORD OF THE LORD!
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

  public static async getInstance(canvas: HTMLCanvasElement, environment?: string): Promise<GameEngine> {
    if (!GameEngine.instance) {
      const env = environment || 'Level Test';
      GameEngine.instance = new GameEngine(canvas, env);
      
      // Initialize WebGPU engine with fallback after construction
      try {
        // Check if WebGPU is supported before attempting to create
        if (navigator.gpu) {
          const webgpuEngine = await WebGPUEngine.CreateAsync(canvas);
          GameEngine.instance.engine = webgpuEngine;
          
          const isWebGPU = webgpuEngine instanceof WebGPUEngine;
          logger.info(`Rendering backend: ${isWebGPU ? 'WebGPU' : 'WebGL2 (fallback)'}`, 'GameEngine');
          logger.info(`GPU Info: ${webgpuEngine.description}`, 'GameEngine');
          logger.info("WebGPU engine created successfully", 'GameEngine');
        } else {
          logger.info('WebGPU not supported by browser, using WebGL2', 'GameEngine');
        }
      } catch (error) {
        logger.warn('WebGPU initialization failed, using WebGL2 fallback:', 'GameEngine');
        logger.warn(`Error: ${error instanceof Error ? error.message : String(error)}`, 'GameEngine');
        // Engine is already set to WebGL2 in constructor, so no need to change it
      }
    }
    return GameEngine.instance;
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

  public createPlayer(playerName: string): any {
    // Player creation is now handled by RemotePeerStateUpdateServiceProvider
    logger.info(`Player creation requested: ${playerName}`, { context: 'GameEngine' });
    return null;
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
      
      // 4. NOTIFY SERVER ABOUT ENVIRONMENT CHANGE
      this.notifyEnvironmentChange(environment);
    }
  }

  public async changeCharacter(characterIndexOrName: number | string): Promise<void> {
    if (this.sceneManager) {
      await this.sceneManager.changeCharacter(characterIndexOrName);
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

  public addRemotePeer(peer: any): void {
    // Remote peer management is now handled by RemotePeerStateUpdateServiceProvider
    logger.info(`Remote peer add requested: ${peer.id}`, { context: 'GameEngine' });
  }

  public removeRemotePeer(peerId: string): void {
    // Remote peer management is now handled by RemotePeerStateUpdateServiceProvider
    logger.info(`Remote peer remove requested: ${peerId}`, { context: 'GameEngine' });
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

  public clearAllPeers(): void {
    if (this.sceneManager) {
      this.sceneManager.clearAllPeers();
    }
  }

  public async dispose(): Promise<void> {
    // Dispose SceneManager from THE WORD OF THE LORD
    if (this.sceneManager) {
      await this.sceneManager.dispose();
    }
    
    this.engine.dispose();
  }
}