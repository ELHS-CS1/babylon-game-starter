import type { Engine, AbstractMesh} from '@babylonjs/core';
import { Scene, TargetCamera, Vector3, HemisphericLight, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ImportMeshAsync, HingeConstraint, Mesh, Texture, StandardMaterial, PBRMaterial } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import { CharacterController } from './CharacterController';
import { SmoothFollowCameraController } from './SmoothFollowCameraController';
import { CollectiblesManager } from './CollectiblesManager';
import { EffectsManager } from './EffectsManager';
import { NodeMaterialManager } from './NodeMaterialManager';
import { ProceduralSoundManager } from './ProceduralSoundManager';
import type { PeerRenderer } from './PeerRenderer';
// Dynamic imports to avoid circular dependencies
// import { localPeerDataService } from '../services/LocalPeerDataServiceProvider';
// import { remotePeerStateUpdateService } from '../services/RemotePeerStateUpdateServiceProvider';
import CONFIG from '../config/gameConfig';
import { ASSETS } from '../config/gameConfig';
import { logger } from '../utils/logger';
import { HUDEvents } from '../utils/hudEventSystem';

// Animation Groups - THE WORD OF THE LORD FROM PLAYGROUND!
const playerAnimations: Record<string, any> = {};

export class SceneManager {
  private readonly scene: Scene;
  private readonly camera: TargetCamera;
  private characterController: CharacterController | null = null;
  private smoothFollowController: SmoothFollowCameraController | null = null;
  private currentEnvironment: string = "Level Test";
  private gameStartTime: number = Date.now();
  private thrusterSound: any = null;
  private isLoadingCharacter: boolean = false;
  private peerRenderer: PeerRenderer | null = null;

  constructor(engine: Engine, _canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.camera = new TargetCamera("camera1", CONFIG.CAMERA.START_POSITION, this.scene);
    
    // Setup HUD update observer - THE WORD OF THE LORD!
    this.setupHUDUpdateObserver();

    // Test PHYSICS logging
    console.log('DIRECT CONSOLE TEST - SceneManager constructor called');
    logger.info('SceneManager constructor called - PHYSICS logging test', { context: 'PHYSICS' });
    
    this.initializeScene().catch(() => {
      logger.error("Failed to initialize scene:", 'SceneManager');
    });
    
    // Add Babylon.js inspector if enabled
    this.setupInspector();
    
    // Initialize PeerRenderer for multiplayer character rendering
    // DEPRECATED: Replaced by RemotePeerStateUpdateServiceProvider
    // this.peerRenderer = new PeerRenderer(this.scene);
    
    // Setup peer rendering update loop
    // DEPRECATED: Replaced by RemotePeerStateUpdateServiceProvider
    // this.setupPeerRenderingLoop();
  }

  private async initializeScene(): Promise<void> {
    this.setupLighting();
    await this.setupPhysics();
    this.setupSky();
    await this.setupEffects();
    await this.loadEnvironment("Level Test");
    this.setupCharacter();
    this.loadCharacterModel();

    // Initialize RemotePeerStateUpdateServiceProvider
    const { remotePeerStateUpdateService } = await import('../services/RemotePeerStateUpdateServiceProvider');
    remotePeerStateUpdateService.initialize(this.scene);

    // Initialize collectibles system - THE WORD OF THE LORD!
    if (this.characterController) {
      await CollectiblesManager.initialize(this.scene, this.characterController);
      
      // Initialize inventory system - THE WORD OF THE LORD!
      const { InventoryManager } = await import('./InventoryManager');
      InventoryManager.initialize(this.scene, this.characterController);
    }

    // Set up environment items after character is fully loaded
    await this.setupEnvironmentItems();
  }

  private setupLighting(): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
  }

  private async setupPhysics(): Promise<void> {
    try {
      logger.info('Initializing physics with HavokPlugin', { context: 'PHYSICS' });
      
      // Wait for Havok to be initialized - THE WORD OF THE LORD!
      const windowObj = window as unknown as Record<string, unknown>;
      const isHavokReady = windowObj['isHavokReady'] as (() => boolean) | undefined;
      
      // Wait for Havok to be ready
      if (isHavokReady && !isHavokReady()) {
        logger.info('Waiting for Havok initialization...', { context: 'PHYSICS' });
        
        // Poll until Havok is ready
        while (!isHavokReady()) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        logger.info('Havok is now ready!', { context: 'PHYSICS' });
      }
      
      // Use HavokPlugin directly like the playground - THE WORD OF THE LORD!
      const havokPlugin = new HavokPlugin(false);
      logger.info('HavokPlugin created successfully', { context: 'PHYSICS' });
      
      this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, havokPlugin);
      logger.info('Physics enabled with gravity', { context: 'PHYSICS', data: CONFIG.PHYSICS.GRAVITY });
      
      // DON'T freeze active meshes in dynamic games with moving characters!
      
    } catch (error) {
      logger.error('HavokPlugin failed, physics disabled', { context: 'PHYSICS', data: error });
    }
  }

  private setupSky(): void {
    // Sky will be set up when environment is loaded
  }

  /**
   * Create a procedural brown noise thruster sound
   * @returns Procedural thruster sound or null
   */
  private async createProceduralThrusterSound(): Promise<any> {
    try {
      // Create a longer brown noise buffer for continuous thruster sound (generate once)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const durationSeconds = 10; // 10 seconds of brown noise
      const frameCount = sampleRate * durationSeconds;
      const baseBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
      const data = baseBuffer.getChannelData(0);

      // Generate brown noise using random walk algorithm (once)
      let lastValue = 0;
      const smoothingFactor = 0.03; // Slightly more aggressive smoothing for thruster effect
      
      for (let i = 0; i < frameCount; i++) {
        // Generate random step
        const randomStep = (Math.random() - 0.5) * 2; // -1 to 1
        
        // Apply random walk with smoothing
        lastValue += randomStep * smoothingFactor;
        
        // Apply exponential decay to prevent drift
        lastValue *= 0.998;
        
        // Clamp to prevent clipping and apply volume
        data[i] = Math.max(-1, Math.min(1, lastValue * 0.4)); // 40% volume for thruster
      }

      // Create gain node for volume control (persistent)
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.4; // 40% volume for thruster
      gainNode.connect(audioContext.destination);
      
      // Create a wrapper object that mimics Babylon.js Sound interface
      const thrusterSound = {
        name: 'ProceduralThruster',
        isPlaying: false,
        loop: true,
        currentBufferSource: null as AudioBufferSourceNode | null,
        audioContext: audioContext,
        baseBuffer: baseBuffer, // Store the base buffer for cloning
        gainNode: gainNode,
        getVolume: () => gainNode.gain.value,
        setVolume: (volume: number) => {
          gainNode.gain.value = volume;
        },
        isReady: () => true, // Always ready since we create it procedurally
        play: () => {
          if (!thrusterSound.isPlaying) {
            // Create a new buffer source each time (required for AudioBufferSourceNode)
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = baseBuffer; // Use the pre-generated base buffer
            bufferSource.loop = true; // Loop the thruster sound
            
            // Connect to gain node
            bufferSource.connect(gainNode);
            
            // Start playing
            bufferSource.start();
            
            // Store reference for stopping
            thrusterSound.currentBufferSource = bufferSource;
            thrusterSound.isPlaying = true;
          }
        },
        stop: () => {
          if (thrusterSound.isPlaying && thrusterSound.currentBufferSource) {
            try {
              thrusterSound.currentBufferSource.stop();
            } catch (error) {
              // Ignore errors if already stopped
            }
            thrusterSound.currentBufferSource.disconnect();
            thrusterSound.currentBufferSource = null;
            thrusterSound.isPlaying = false;
          }
        },
        dispose: () => {
          if (thrusterSound.currentBufferSource) {
            thrusterSound.currentBufferSource.disconnect();
          }
          gainNode.disconnect();
        }
      };

      return thrusterSound;
      
    } catch (error) {
      return null;
    }
  }

  private async setupEffects(): Promise<void> {
    try {
      EffectsManager.initialize(this.scene);
      NodeMaterialManager.initialize(this.scene);
      ProceduralSoundManager.initialize(this.scene);

      // Create procedural brown noise thruster sound
      const thrusterSound = await this.createProceduralThrusterSound();
      
      if (thrusterSound) {
        // Store the thruster sound for later use
        this.thrusterSound = thrusterSound;
      }
    } catch (error) {
      console.warn("Failed to setup effects:", error);
    }
  }

  public async loadEnvironment(environmentName: string): Promise<void> {
    // Find the environment by name
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === environmentName);
    if (!environment) {
      logger.error(`Environment "${environmentName}" not found in ASSETS.ENVIRONMENTS`, 'SceneManager');
      return;
    }

    // Clear existing environment particles before creating new ones
    this.clearParticles();

    try {
      logger.info(`Loading environment: ${environmentName}`, 'SceneManager');
      logger.info(`Environment model URL: ${environment.model}`, 'SceneManager');
      
      const result = await ImportMeshAsync(environment.model, this.scene);
      logger.info(`Environment loaded successfully, meshes: ${result.meshes.length}`, 'SceneManager');

      // Process node materials for environment meshes
      await NodeMaterialManager.processImportResult(result);

      // Rename the root node to "environment" for better organization
      if (result.meshes && result.meshes.length > 0) {
        // Find the root mesh (the one without a parent)
        const rootMesh = result.meshes.find((mesh: any) => !mesh.parent);
        if (rootMesh) {
          rootMesh.name = "environment";
          if (environment.scale !== 1) {
            rootMesh.scaling.x = -environment.scale; // invert X-axis to fix handedness
            rootMesh.scaling.y = environment.scale;
            rootMesh.scaling.z = environment.scale;
          }
        }
      }

      if (environment.sky) {
        this.createSky(environment.sky);
      }

            this.setupEnvironmentPhysics(environment);

            // Set up environment-specific particles if configured
            if (environment.particles) {
              try {
                for (const particle of environment.particles) {
                  const particleSystem = await EffectsManager.createParticleSystem(particle.name, particle.position);

                  // Apply environment-specific settings if provided
                  if (particleSystem && particle.updateSpeed !== undefined) {
                    particleSystem.updateSpeed = particle.updateSpeed;
                  }
                }
              } catch (error) {
                console.warn("Failed to create environment particles:", error);
              }
            }

            this.currentEnvironment = environmentName;
            logger.info(`Environment ${environmentName} setup complete`, 'SceneManager');
    } catch (error) {
      logger.error(`Failed to load environment: ${error}`, 'SceneManager');
      throw error; // Re-throw to be caught by initializeScene
    }
  }

  private createSky(_skyConfig: any): void {
    // Sky lighting handled by main HemisphericLight - no duplicate lights!
  }

  private setupEnvironmentPhysics(environment: any): void {
    this.setupLightmappedMeshes(environment);
    this.setupPhysicsObjects(environment);
    this.setupJoints(environment);

    // Fallback: If no physics objects or lightmapped meshes are configured,
    // create physics bodies for all environment meshes to prevent falling through
    if (environment.physicsObjects?.length === 0 && environment.lightmappedMeshes?.length === 0) {
      this.setupFallbackPhysics(environment);
    }
  }

  private setupLightmappedMeshes(environment: any): void {
    const lightmap = new Texture(environment.lightmap);

    environment.lightmappedMeshes?.forEach((lightmappedMesh: any) => {
      const mesh = this.scene.getMeshByName(lightmappedMesh.name);
      if (!mesh) return;

      new PhysicsAggregate(mesh, PhysicsShapeType.MESH);
      mesh.isPickable = false;

      if (mesh.material instanceof StandardMaterial || mesh.material instanceof PBRMaterial) {
        mesh.material.lightmapTexture = lightmap;
        mesh.material.useLightmapAsShadowmap = true;
        (mesh.material.lightmapTexture as Texture).uAng = Math.PI;
        (mesh.material.lightmapTexture as Texture).level = lightmappedMesh.level;
        (mesh.material.lightmapTexture as Texture).coordinatesIndex = 1;
      }

      mesh.freezeWorldMatrix();
      mesh.doNotSyncBoundingInfo = true;
    });
  }

  private setupPhysicsObjects(environment: any): void {
    logger.info(`Setting up physics objects for environment: ${environment.name}`, 'SceneManager');
    logger.info(`Physics objects count: ${environment.physicsObjects?.length || 0}`, 'SceneManager');
    
    environment.physicsObjects?.forEach((physicsObject: any) => {
      const mesh = this.scene.getMeshByName(physicsObject.name);
      if (mesh) {
        logger.info(`Found physics object mesh: ${physicsObject.name}`, 'SceneManager');
        // Apply scaling if specified
        if (physicsObject.scale !== 1) {
          mesh.scaling.setAll(physicsObject.scale);
        }

        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: physicsObject.mass });
        logger.info(`Created physics aggregate for ${physicsObject.name} with mass ${physicsObject.mass}`, 'SceneManager');
      } else {
        logger.warn(`Physics object mesh not found: ${physicsObject.name}`, 'SceneManager');
      }
    });
  }

  private setupJoints(environment: any): void {
    // Find objects with PIVOT_BEAM role
    const pivotBeams = environment.physicsObjects?.filter((obj: any) => obj.role === 'PIVOT_BEAM') || [];

    pivotBeams.forEach((pivotBeam: any) => {
      const beamMesh = this.scene.getMeshByName(pivotBeam.name);
      if (!beamMesh) return;
      
      beamMesh.scaling.set(3, 0.05, 1);

      // Find a fixed mass object to attach the hinge to
      const fixedMassObject = environment.physicsObjects?.find((obj: any) => obj.role === 'DYNAMIC_BOX' && obj.mass === 0);
      if (!fixedMassObject) return;

      const fixedMesh = this.scene.getMeshByName(fixedMassObject.name);
      if (!fixedMesh) return;

      // Create physics aggregates if they don't exist
      const fixedMass = new PhysicsAggregate(fixedMesh, PhysicsShapeType.BOX, { mass: 0 });
      const beam = new PhysicsAggregate(beamMesh, PhysicsShapeType.BOX, { mass: pivotBeam.mass });

      // Create hinge constraint
      const joint = new HingeConstraint(
        new Vector3(0.75, 0, 0),
        new Vector3(-0.25, 0, 0),
        new Vector3(0, 0, -1),
        new Vector3(0, 0, 1),
        this.scene
      );

      fixedMass.body.addConstraint(beam.body, joint);
    });
  }

  private setupFallbackPhysics(_environment: any): void {
    // Find the root environment mesh
    const rootEnvironmentMesh = this.scene.getMeshByName("environment");
    if (!rootEnvironmentMesh) return;

    // Collect all meshes in the environment
    const allEnvironmentMeshes: AbstractMesh[] = [];
    const collectMeshes = (mesh: AbstractMesh) => {
      allEnvironmentMeshes.push(mesh);
      mesh.getChildMeshes().forEach(collectMeshes);
    };
    collectMeshes(rootEnvironmentMesh);

    // Create physics bodies for all meshes with geometry
    allEnvironmentMeshes.forEach(mesh => {
      if (mesh instanceof Mesh && mesh.geometry && mesh.geometry.getTotalVertices() > 0) {
        // Create a static physics body (mass = 0) for environment geometry
        // The physics shape will automatically account for the mesh's current scaling
        new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 });
        mesh.isPickable = false;
      }
    });
  }

  private setupCharacter(): void {
    this.characterController = new CharacterController(this.scene);

    if (this.characterController) {
      this.smoothFollowController = new SmoothFollowCameraController(
        this.scene,
        this.camera,
        this.characterController.getDisplayCapsule()
      );

      // Connect the character controller to the camera controller
      this.characterController.setCameraController(this.smoothFollowController);
    }
  }

  private loadCharacterModel(): void {
    // Load the first character from the CHARACTERS array
    const character = ASSETS.CHARACTERS[0];
    if (!character) {
      logger.error("No character found in ASSETS.CHARACTERS", 'SceneManager');
      return;
    }

    this.loadCharacter(character);
  }

  private loadCharacter(character: any, preservedPosition?: Vector3 | null): void {
    // Remove all animation groups from the scene before loading a new character
    this.scene.animationGroups.slice().forEach(group => { group.dispose(); });

    // Debug: Log character loading
    logger.info(`Loading character: ${character.name}`, 'SceneManager');

    // Check if character is already loading to prevent duplicate loads
    if (this.isLoadingCharacter) {
      logger.warn(`Character ${character.name} is already loading, skipping duplicate load`, 'SceneManager');
      return;
    }
    
    this.isLoadingCharacter = true;

    ImportMeshAsync(character.model, this.scene)
      .then(async result => {
        // Process node materials for character meshes
        await NodeMaterialManager.processImportResult(result);

        // Rename the root node to "player" for better organization
        if (result.meshes && result.meshes.length > 0) {
          // Find the root mesh (the one without a parent)
          const rootMesh = result.meshes.find((mesh: any) => !mesh.parent);
          if (rootMesh) {
            rootMesh.name = "player";
          }
        }

        if (this.characterController && result.meshes[0]) {
          // Apply character scale to all meshes - CRITICAL for proper character size
          result.meshes.forEach(mesh => {
            mesh.scaling.setAll(character.scale);
          });

          // Set the player mesh in the character controller
          this.characterController.setPlayerMesh(result.meshes[0]);

          // Determine position for new character - MUST obey spawn position
          let characterPosition: Vector3;
          if (preservedPosition) {
            // Use preserved position when switching characters
            characterPosition = preservedPosition;
          } else {
            // Use spawn point when loading character for the first time or after environment change
            const currentEnvironment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
            characterPosition = currentEnvironment ? currentEnvironment.spawnPoint : new Vector3(0, 0, 0);
          }

          // Update character physics with determined position - CRITICAL for proper positioning
          this.characterController.updateCharacterPhysics(character, characterPosition);

          // Reset loading flag
          this.isLoadingCharacter = false;

          // Setup animations using character's animation mapping with fallbacks - THE WORD OF THE LORD
          playerAnimations['walk'] = result.animationGroups.find(a => a.name === character.animations.walk) ||
            result.animationGroups.find(a => a.name.toLowerCase().includes('walk')) ||
            result.animationGroups.find(a => a.name.toLowerCase().includes('run')) ||
            result.animationGroups.find(a => a.name.toLowerCase().includes('move'));

          playerAnimations['idle'] = result.animationGroups.find(a => a.name === character.animations.idle) ||
            result.animationGroups.find(a => a.name.toLowerCase().includes('idle')) ||
            result.animationGroups.find(a => a.name.toLowerCase().includes('stand'));

          // Debug: Log animation setup results
          if (!playerAnimations['walk'] || !playerAnimations['idle']) {
            logger.warn(`Animation setup for ${character.name}:`, 'SceneManager');
            logger.warn(`Available animations: ${result.animationGroups.map(a => a.name).join(', ')}`, 'SceneManager');
            logger.warn(`Found walk: ${playerAnimations['walk']?.name || 'NOT FOUND'}`, 'SceneManager');
            logger.warn(`Found idle: ${playerAnimations['idle']?.name || 'NOT FOUND'}`, 'SceneManager');
          }

          // Stop animations initially
          playerAnimations['walk']?.stop();
          playerAnimations['idle']?.stop();

          // Set character in animation controller - THE WORD OF THE LORD
          if (this.characterController && this.characterController.animationController) {
            this.characterController.animationController.setCharacter(character);
          }

          // Create particle system attached to player mesh
          const playerParticleSystem = await EffectsManager.createParticleSystem(CONFIG.EFFECTS.DEFAULT_PARTICLE, result.meshes[0]);
          if (playerParticleSystem && this.characterController) {
            this.characterController.setPlayerParticleSystem(playerParticleSystem);
          }

          // Set up thruster sound for character controller
          if (this.thrusterSound && this.characterController) {
            this.characterController.setThrusterSound(this.thrusterSound);
          }

        // Initialize peer data service immediately (no polling needed)
        await this.initializePeerDataService(character);

          logger.info(`Character ${character.name} loaded successfully at position:`, 'SceneManager');
        }
      })
      .catch((error) => {
        logger.error(`Failed to load character (${character.name}):`, 'SceneManager');
        logger.error(`Error: ${error.message}`, 'SceneManager');
        logger.error(`Model URL: ${character.model}`, 'SceneManager');
        this.isLoadingCharacter = false;
      });
  }

  public async setupEnvironmentItems(): Promise<void> {
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
    if (environment) {
      try {
        await CollectiblesManager.setupEnvironmentItems(environment);
      } catch (error) {
        logger.error("Failed to setup environment items:", 'SceneManager');
      }
    }
  }

  public getScene(): Scene {
    return this.scene;
  }

  // ============================================================================
  // PEER RENDERING - DataStar Best Practices Integration
  // ============================================================================
  
  public async processPeerUpdates(): Promise<void> {
    if (!this.peerRenderer) {
      return;
    }

    // Import gameState to get current peer data
    const { gameState } = await import('../state');
    
    // Process each peer in the game state
    for (const peer of gameState.players) {
      try {
        // Check if peer character exists, if not create it
        await this.peerRenderer.createPeerCharacter(peer);
        
        // Update peer position and rotation with boost state and character state
        this.peerRenderer.updatePeerPosition(
          peer.id,
          new Vector3(peer.position.x, peer.position.y, peer.position.z),
          new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z),
          peer.boostActive,
          peer.state
        );
      } catch (error) {
        logger.error(`Failed to process peer ${peer.id}:`, { context: 'SceneManager', tag: 'peer', error });
      }
    }
  }

  public updatePeerInterpolation(deltaTime: number): void {
    if (this.peerRenderer) {
      this.peerRenderer.updatePeerInterpolation(deltaTime);
    }
  }

  public clearAllPeers(): void {
    if (this.peerRenderer) {
      this.peerRenderer.clearAllPeerCharacters();
    }
  }

  // DEPRECATED: Replaced by RemotePeerStateUpdateServiceProvider
  // private setupPeerRenderingLoop(): void {
  //   if (!this.peerRenderer) {
  //     return;
  //   }

  //   let lastPeerUpdate = 0;
  //   const peerUpdateInterval = 100; // Update peers every 100ms

  //   // Setup peer rendering update loop using onBeforeRenderObservable
  //   this.scene.onBeforeRenderObservable.add(() => {
  //     const now = Date.now();
      
  //     // Process peer updates at regular intervals
  //     if (now - lastPeerUpdate >= peerUpdateInterval) {
  //       this.processPeerUpdates().catch(error => {
  //         logger.error('Failed to process peer updates:', { context: 'SceneManager', tag: 'peer', error });
  //       });
  //       lastPeerUpdate = now;
  //     }
      
  //     // Update peer interpolation every frame for smooth movement
  //     const deltaTime = this.scene.getEngine().getDeltaTime() / 1000; // Convert to seconds
  //     this.updatePeerInterpolation(deltaTime);
  //   });

  //   logger.info('Peer rendering loop setup complete', { context: 'SceneManager', tag: 'peer' });
  // }


  public getCharacterController(): CharacterController | null {
    return this.characterController;
  }

  public getCamera(): TargetCamera {
    return this.camera;
  }

  public getSmoothFollowController(): SmoothFollowCameraController | null {
    return this.smoothFollowController;
  }

  public pausePhysics(): void {
    if (this.characterController) {
      this.characterController.pausePhysics();
    }
  }

  public resumePhysics(): void {
    if (this.characterController) {
      this.characterController.resumePhysics();
    }
  }

  public getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  public clearEnvironment(): void {
    const rootEnvironmentMesh = this.scene.getMeshByName("environment");

    if (rootEnvironmentMesh) {
      const allEnvironmentMeshes: AbstractMesh[] = [];
      const collectMeshes = (mesh: AbstractMesh) => {
        allEnvironmentMeshes.push(mesh);
        mesh.getChildMeshes().forEach(collectMeshes);
      };

      collectMeshes(rootEnvironmentMesh);

      allEnvironmentMeshes.forEach(mesh => {
        if (mesh.physicsImpostor) {
          mesh.physicsImpostor.dispose();
        }
        mesh.dispose();
      });
    } else {
      const potentialEnvironmentMeshes = this.scene.meshes.filter(mesh =>
        !mesh.name.includes("player") &&
        !mesh.name.includes("camera") &&
        !mesh.name.includes("light") &&
        !mesh.name.includes("sky") &&
        !mesh.name.includes("capsule") &&
        !mesh.name.includes("fallback_") &&
        !mesh.name.includes("crate_") &&
        !mesh.name.includes("item_") &&
        !mesh.name.includes("CharacterDisplay") &&
        mesh !== this.characterController?.getDisplayCapsule()
      );

      potentialEnvironmentMeshes.forEach(mesh => {
        if (mesh.physicsImpostor) {
          mesh.physicsImpostor.dispose();
        }
        mesh.dispose();
      });
    }
  }

  public clearItems(): void {
    CollectiblesManager.clearCollectibles();
  }

  public clearParticles(): void {
    // Clear only environment and item particles - preserve player particles - THE WORD OF THE LORD!
    EffectsManager.removeEnvironmentParticles();
    EffectsManager.removeItemParticles();
  }

  public repositionCharacter(): void {
    if (this.characterController) {
      const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
      if (environment?.spawnPoint) {
        this.characterController.setPosition(environment.spawnPoint);
      }
    }
  }

  public forceActivateSmoothFollow(): void {
    if (this.smoothFollowController) {
      this.smoothFollowController.forceActivateSmoothFollow();
    }
  }

  public async changeEnvironment(environmentName: string): Promise<void> {
    // Check if the environment is actually different from current
    if (this.currentEnvironment === environmentName) {
      return; // No change needed
    }

    // Pause physics to prevent character from falling during environment change
    this.pausePhysics();

    // Clear existing environment, items, and particles
    this.clearEnvironment();
    this.clearItems();
    this.clearParticles();

    // Load the new environment
    await this.loadEnvironment(environmentName);

    // Set up environment items for the new environment
    await this.setupEnvironmentItems();

    // Notify LocalPeerDataServiceProvider of environment change
    const { localPeerDataService } = await import('../services/LocalPeerDataServiceProvider');
    localPeerDataService.changeEnvironment(environmentName);

    // Reposition character to safe location in new environment
    this.repositionCharacter();

    // Force activate smooth camera following after environment transition
    this.forceActivateSmoothFollow();

    // Resume physics after environment is loaded
    this.resumePhysics();
  }

  public async changeCharacter(characterIndexOrName: number | string): Promise<void> {
    let character: any;

    if (typeof characterIndexOrName === 'number') {
      // Handle numeric index
      if (characterIndexOrName < 0 || characterIndexOrName >= ASSETS.CHARACTERS.length) {
        logger.error(`Invalid character index: ${characterIndexOrName}`, 'SceneManager');
        return;
      }
      character = ASSETS.CHARACTERS[characterIndexOrName];
    } else {
      // Handle character name
      character = ASSETS.CHARACTERS.find(char => char.name === characterIndexOrName);
    }

    if (!character) {
      logger.error(`Character not found: ${characterIndexOrName}`, 'SceneManager');
      return;
    }

    // Save current character position before switching
    let currentPosition: Vector3 | null = null;
    if (this.characterController) {
      currentPosition = this.characterController.getPosition().clone();
    }

    // Remove ALL existing player meshes - dispose all meshes that might be part of the character
    const existingPlayer = this.scene.getMeshByName("player");
    if (existingPlayer) {
      // Dispose all child meshes first
      existingPlayer.getChildMeshes().forEach(child => { child.dispose(); });
      existingPlayer.dispose();
    }

    // Also dispose any meshes that might have been loaded but not properly named
    // This is critical to prevent duplicate characters
    const allMeshes = this.scene.meshes.slice();
    allMeshes.forEach(mesh => {
      if (mesh.name.includes('player') || mesh.name.includes('character') || 
          (mesh.parent && mesh.parent.name === 'player')) {
        mesh.dispose();
      }
    });

    // Dispose any orphaned meshes that might be from previous character loads
    const remainingMeshes = this.scene.meshes.slice();
    remainingMeshes.forEach(mesh => {
      // If mesh has no parent and is not an environment mesh, dispose it
      if (!mesh.parent && !mesh.name.includes('environment') && !mesh.name.includes('ground') && 
          !mesh.name.includes('sky') && !mesh.name.includes('light')) {
        mesh.dispose();
      }
    });

    // Load the new character with preserved position
    this.loadCharacter(character, currentPosition);
    
    // Notify LocalPeerDataServiceProvider of character change
    const { localPeerDataService } = await import('../services/LocalPeerDataServiceProvider');
    localPeerDataService.changeCharacterModel(character.name);
    
    logger.info(`Character changed to: ${character.name}`, 'SceneManager');
  }

  private async initializePeerDataService(character: any): Promise<void> {
    if (!this.characterController) return;
    
    const { dataStarIntegration } = await import('../datastar-integration');
    const peerId = dataStarIntegration.getMyPeerId();
    const playerName = 'Player_' + Math.random().toString(36).substr(2, 9);
    const { localPeerDataService } = await import('../services/LocalPeerDataServiceProvider');
    
    localPeerDataService.initialize(this.characterController, peerId, playerName, this.currentEnvironment, character.name);
    logger.info('LocalPeerDataServiceProvider initialized', 'SceneManager');
  }

  public async dispose(): Promise<void> {

    // Dispose LocalPeerDataServiceProvider
    const { localPeerDataService } = await import('../services/LocalPeerDataServiceProvider');
    localPeerDataService.dispose();

    // Dispose RemotePeerStateUpdateServiceProvider
    const { remotePeerStateUpdateService } = await import('../services/RemotePeerStateUpdateServiceProvider');
    remotePeerStateUpdateService.dispose();

    // Dispose character controller
    if (this.characterController) {
      this.characterController.dispose();
    }

    // Dispose smooth follow controller
    if (this.smoothFollowController) {
      this.smoothFollowController.dispose();
    }

    // Dispose scene
    this.scene.dispose();
  }

  private setupInspector(): void {
    // Expose inspector functions globally for manual debugging
    
    (window as any).showBabylonInspector = () => {
      console.clear();
      console.log('🔍 BABYLON.JS SCENE INSPECTOR');
      console.log('=====================================');
      
      // Scene info
      console.log('📊 SCENE INFO:');
      console.log('  - Meshes:', this.scene.meshes.length);
      console.log('  - Lights:', this.scene.lights.length);
      console.log('  - Cameras:', this.scene.cameras.length);
      console.log('  - Materials:', this.scene.materials.length);
      console.log('  - Textures:', this.scene.textures.length);
      
      // Sound info - THE IMPORTANT STUFF!
      console.log('🎵 SOUND INFO:');
      const sounds = this.scene.soundTracks
      ?.map(track => track.soundCollection)
      .flat().filter(sound => sound !== null && sound !== undefined) || [];
      console.log('  - Total Sounds:', sounds.length);
      sounds.forEach((sound, index) => {
        console.log(`  - Sound ${index + 1}:`, {
          name: sound.name || 'Unknown',
          isPlaying: sound.isPlaying || false,
          isReady: sound.isReady ? sound.isReady() : 'N/A',
          volume: sound.getVolume() || 0,
          loop: sound.loop || false,
          autoplay: sound.autoplay || false
        });
      });
      
      // Character thruster sound - THE MAIN ISSUE!
      if (this.characterController) {
        console.log('👤 CHARACTER THRUSTER SOUND:');
        const thrusterSound = this.characterController.getThrusterSound();
        if (thrusterSound) {
          console.log('  - Thruster Sound Found:', {
            name: thrusterSound.name,
            isPlaying: thrusterSound.isPlaying,
            isReady: thrusterSound.isReady ? thrusterSound.isReady() : 'N/A',
            volume: thrusterSound.getVolume(),
            loop: thrusterSound.loop,
            autoplay: thrusterSound.autoplay
          });
        } else {
          console.log('  - ❌ NO THRUSTER SOUND FOUND!');
        }
      }
      
      // Physics info
      console.log('⚡ PHYSICS INFO:');
      console.log('  - Physics Enabled:', this.scene.isPhysicsEnabled());
      if (this.scene.isPhysicsEnabled()) {
        console.log('  - Gravity:', this.scene.getPhysicsEngine()?.gravity);
      }
      
      console.log('=====================================');
      console.log('💡 Use scene.meshes, scene.lights, etc. to explore objects');
      console.log('💡 Use scene.soundTracks to explore sounds');
      console.log('💡 Use characterController.getThrusterSound() to debug thruster');
    };
    
    (window as any).hideBabylonInspector = () => {
      if (this.scene.debugLayer.isVisible()) {
        this.scene.debugLayer.hide();
      }
    };
    
    (window as any).toggleBabylonInspector = async () => {
      if (this.scene.debugLayer.isVisible()) {
        (window as any).hideBabylonInspector();
      } else {
        await (window as any).showBabylonInspector();
      }
    };
    
    // Add keyboard shortcut for inspector (Shift+Ctrl+Alt+I)
    window.addEventListener('keydown', (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this.scene.debugLayer.isVisible()) {
          this.scene.debugLayer.hide();
        } else {
          (window as any).showBabylonInspector();
        }
      }
    });
    
    // Check if inspector is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const inspectorEnabled = urlParams.get('inspector') === 'true';
    
    if (inspectorEnabled) {
      // Delay inspector loading to avoid startup errors
      setTimeout(() => {
        (window as any).showBabylonInspector();
      }, 2000);
    }
  }

  private setupHUDUpdateObserver(): void {
    // Setup onBeforeRenderObservable to trigger HUD updates - THE WORD OF THE LORD!
    this.scene.onBeforeRenderObservable.add(() => {
      // Update HUD values every frame
      this.updateHUDValues();
    });
  }

  private updateHUDValues(): void {
    // Update coordinates from character position
    if (this.characterController) {
      const position = this.characterController.getPosition();
      
      // Trigger HUD coordinates update via event system
      HUDEvents.coordinates(position.x, position.y, position.z);
    }

    // Update absolute FPS from engine
    const engine = this.scene.getEngine();
    const fps = Math.round(engine.getFps());
    HUDEvents.fps(fps);

    // Update elapsed game time
    const elapsedMs = Date.now() - this.gameStartTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const gameTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    HUDEvents.time(gameTime);
  }
}
