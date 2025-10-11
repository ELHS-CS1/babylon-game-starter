import type { Engine, AbstractMesh} from '@babylonjs/core';
import { Scene, TargetCamera, Vector3, HemisphericLight, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ImportMeshAsync, HingeConstraint, Mesh, Texture, StandardMaterial, PBRMaterial } from '@babylonjs/core';
import { CharacterController } from './CharacterController';
import { SmoothFollowCameraController } from './SmoothFollowCameraController';
import { CollectiblesManager } from './CollectiblesManager';
import { EffectsManager } from './EffectsManager';
import { NodeMaterialManager } from './NodeMaterialManager';
import CONFIG from '../config/gameConfig';
import { ASSETS } from '../config/gameConfig';
import { logger } from '../utils/logger';

export class SceneManager {
  private readonly scene: Scene;
  private readonly camera: TargetCamera;
  private characterController: CharacterController | null = null;
  private smoothFollowController: SmoothFollowCameraController | null = null;
  private currentEnvironment: string = "Level Test";

  constructor(engine: Engine, _canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.camera = new TargetCamera("camera1", CONFIG.CAMERA.START_POSITION, this.scene);

    this.initializeScene().catch(() => {
      logger.error("Failed to initialize scene:", 'SceneManager');
    });
  }

  private async initializeScene(): Promise<void> {
    this.setupLighting();
    await this.setupPhysics();
    this.setupSky();
    await this.setupEffects();
    await this.loadEnvironment("Level Test");
    this.setupCharacter();
    this.loadCharacterModel();

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
      // Import HavokPhysics dynamically as per official documentation
      const HavokPhysics = (await import('@babylonjs/havok')).default;
      const havokInstance = await HavokPhysics();
      const havokPlugin = new HavokPlugin(false, havokInstance);
      this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, havokPlugin);
      
      // DON'T freeze active meshes in dynamic games with moving characters!
      
      logger.info("Havok physics engine initialized successfully", 'SceneManager');
    } catch (error) {
      logger.warn("HavokPlugin failed, physics disabled:", 'SceneManager');
    }
  }

  private setupSky(): void {
    // Sky will be set up when environment is loaded
  }

  private async setupEffects(): Promise<void> {
    try {
      EffectsManager.initialize(this.scene);
      NodeMaterialManager.initialize(this.scene);

      // Create thruster sound
      await EffectsManager.createSound("Thruster");
    } catch (error) {
      logger.warn("Failed to setup effects:", 'SceneManager');
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
                logger.warn("Failed to create environment particles:", 'SceneManager');
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

      new PhysicsAggregate(mesh, PhysicsShapeType.BOX);
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
        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 });
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
          // Apply character scale to all meshes
          result.meshes.forEach(mesh => {
            mesh.scaling.setAll(character.scale);
          });

          this.characterController.setPlayerMesh(result.meshes[0]);

          // Determine position for new character
          let characterPosition: Vector3;
          if (preservedPosition) {
            // Use preserved position when switching characters
            characterPosition = preservedPosition;
          } else {
            // Use spawn point when loading character for the first time or after environment change
            const currentEnvironment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
            characterPosition = currentEnvironment ? currentEnvironment.spawnPoint : new Vector3(0, 0, 0);
          }

          // Update character physics with determined position
          this.characterController.updateCharacterPhysics(character, characterPosition);

          // Setup animations using character's animation mapping with fallbacks - THE WORD OF THE LORD
          const playerAnimations: Record<string, any> = {};
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
          const thrusterSound = EffectsManager.getSound("Thruster");
          logger.info(`Retrieved thruster sound: ${thrusterSound ? 'SUCCESS' : 'FAILED'}`, 'SceneManager');
          if (thrusterSound && this.characterController) {
            logger.info("Setting thruster sound on character controller", 'SceneManager');
            this.characterController.setThrusterSound(thrusterSound);
          } else {
            logger.warn("Failed to set thruster sound - sound or character controller missing", 'SceneManager');
          }

          logger.info(`Character ${character.name} loaded successfully at position:`, 'SceneManager');
        }
      })
      .catch(() => {
        logger.error("Failed to load character:", 'SceneManager');
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

    // Reposition character to safe location in new environment
    this.repositionCharacter();

    // Force activate smooth camera following after environment transition
    this.forceActivateSmoothFollow();

    // Resume physics after environment is loaded
    this.resumePhysics();
  }

  public dispose(): void {
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
}
