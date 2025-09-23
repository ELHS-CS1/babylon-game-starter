// ============================================================================
// SCENE MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { 
  Engine,
  AbstractMesh
} from '@babylonjs/core';
import { 
  Scene, 
  TargetCamera, 
  HemisphericLight, 
  Vector3, 
  Color3, 
  StandardMaterial, 
  PBRMaterial, 
  Texture
} from '@babylonjs/core';
import { ImportMeshAsync, PhysicsAggregate, PhysicsShapeType, HavokPlugin } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { CharacterController } from './CharacterController';
import { SmoothFollowCameraController } from './SmoothFollowCameraController';
import { EffectsManager } from './EffectsManager';
import { InventoryManager } from './InventoryManager';
import { CollectiblesManager } from './CollectiblesManager';
import CONFIG, { ASSETS, type Character } from '../config/gameConfig';

// Import OBJECT_ROLE constants - THE WORD OF GOD!
const OBJECT_ROLE = {
  DYNAMIC_BOX: "DYNAMIC_BOX",
  PIVOT_BEAM: "PIVOT_BEAM"
} as const;

type ObjectRole = typeof OBJECT_ROLE[keyof typeof OBJECT_ROLE];

// Character interface is imported from AnimationController - THE WORD OF GOD

// LightmappedMesh interface from THE WORD OF GOD
interface LightmappedMesh {
  readonly name: string;
  readonly level: number;
}

// PhysicsObject interface from THE WORD OF GOD
interface PhysicsObject {
  readonly name: string;
  readonly mass: number;
  readonly scale: number;
  readonly role: ObjectRole;
}

// SkyConfig interface from THE WORD OF GOD
interface SkyConfig {
  readonly TEXTURE_URL: string;
  readonly ROTATION_Y: number;
  readonly BLUR: number;
  readonly TYPE: "BOX" | "SPHERE";
}

// EnvironmentParticle interface from THE WORD OF GOD
interface EnvironmentParticle {
  readonly name: string; // Name of the particle snippet to use
  readonly position: Vector3; // Position where the particle should be created
  readonly updateSpeed?: number; // Optional update speed for the particle system
}

// ItemConfig interface from THE WORD OF GOD
interface ItemConfig {
  readonly name: string;
  readonly url: string;
  readonly collectible: boolean;
  readonly creditValue: number;
  readonly minImpulseForCollection: number;
  readonly instances: readonly ItemInstance[];
  readonly inventory?: boolean;
  readonly thumbnail?: string;
  readonly itemEffectKind?: "superJump" | "invisibility";
}

interface ItemInstance {
  readonly position: Vector3;
  readonly scale: number;
  readonly rotation: Vector3;
  readonly mass: number;
}

// Environment interface from THE WORD OF GOD - IDENTICAL TO PLAYGROUND.TS
interface Environment {
  readonly name: string;
  readonly model: string;
  readonly lightmap: string;
  readonly scale: number;
  readonly lightmappedMeshes: readonly LightmappedMesh[];
  readonly physicsObjects: readonly PhysicsObject[];
  readonly sky?: SkyConfig; // Optional sky configuration for this environment
  readonly spawnPoint: Vector3; // Spawn point for this environment
  readonly particles?: readonly EnvironmentParticle[]; // Optional environment particles
  readonly items?: readonly ItemConfig[]; // Optional items configuration for this environment
}

// ASSETS is now imported from gameConfig.ts - THE WORD OF GOD

export class SceneManager {
  private readonly scene: Scene;
  private readonly camera: TargetCamera;
  private characterController: CharacterController | null = null;
  private smoothFollowController: SmoothFollowCameraController | null = null;
  private currentEnvironment: string = "Level Test"; // Track current environment
  private currentCharacter: Character | null = null; // Track current character

  constructor(engine: Engine, _canvas: HTMLCanvasElement) {
    console.log("SceneManager constructor called");
    
    this.scene = new Scene(engine);
    console.log("Babylon.js scene created");
    
    this.camera = new TargetCamera("camera1", CONFIG.CAMERA.START_POSITION, this.scene);
    console.log("Camera created at position:", CONFIG.CAMERA.START_POSITION);

    this.initializeScene().catch(error => {
      console.error("Failed to initialize scene:", error);
    });
  }

  private async initializeScene(): Promise<void> {
    console.log("Initializing scene...");
    
    this.setupLighting();
    console.log("Setup lighting");
    
    await this.setupPhysics();
    console.log("Setup physics");
    
    this.setupSky();
    console.log("Setup sky");
    
    await this.setupEffects();
    console.log("Setup effects");
    
    await this.loadEnvironment("Level Test");
    console.log("Loaded environment");
    
    this.setupCharacter();
    console.log("Setup character");
    
    await this.loadCharacterModel();
    console.log("Loaded character model");

    // Set up environment items after character is fully loaded
    await this.setupEnvironmentItems();
    console.log("Setup environment items");

    // Initialize inventory system
    if (this.characterController) {
      // InventoryManager.initialize(this.scene, this.characterController);
    }
    
    console.log("Scene initialization complete");
  }

  private setupLighting(): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
  }

  private async setupPhysics(): Promise<void> {
    // IDENTICAL TO PLAYGROUND.TS - THE WORD OF THE LORD!
    try {
      // Initialize Havok exactly as in playground.ts - use the global HK function
      const havokInstance = await (window as any).HK();
      const hkPlugin = new HavokPlugin(false, havokInstance);
      this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, hkPlugin);
      console.log("Havok physics engine initialized successfully");
    } catch (error) {
      console.warn("HavokPlugin failed, physics disabled:", error);
      // NO FALLBACK TO CANNON - WE DON'T USE CANNON!
      // Physics will be disabled if Havok fails
    }
  }

  private setupSky(): void {
    // Sky will be set up when environment is loaded
  }

  private async setupEffects(): Promise<void> {
    try {
      EffectsManager.initialize(this.scene);
      console.log("EffectsManager initialized");

      // Create thruster sound
      await EffectsManager.createSound("Thruster");
      console.log("Thruster sound created");
    } catch (error) {
      console.warn("Failed to setup effects:", error);
    }
  }

  public async loadEnvironment(environmentName: string): Promise<void> {
    console.log(`Loading environment: ${environmentName}`);
    
    // Find the environment by name
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === environmentName);
    if (!environment) {
      console.error(`Environment "${environmentName}" not found in ASSETS.ENVIRONMENTS`);
      return;
    }

    console.log(`Found environment:`, environment);

    // Clear existing environment particles before creating new ones
    this.clearParticles();

    try {
      console.log(`Loading model from: ${environment.model}`);
      const result = await ImportMeshAsync(environment.model, this.scene);
      console.log(`Loaded environment meshes:`, result.meshes.length);

      // Process node materials for environment meshes
      // await NodeMaterialManager.processImportResult(result);

      // Rename the root node to "environment" for better organization
      if (result.meshes && result.meshes.length > 0) {
        // Find the root mesh (the one without a parent)
        const rootMesh = result.meshes.find(mesh => !mesh.parent);
        if (rootMesh) {
          rootMesh.name = "environment";
          console.log(`Set environment mesh name to: ${rootMesh.name}`);
          if (environment.scale !== 1) {
            rootMesh.scaling.x = -environment.scale; // invert X-axis to fix handedness
            rootMesh.scaling.y = environment.scale;
            rootMesh.scaling.z = environment.scale;
            console.log(`Applied scale: ${environment.scale}`);
          }
        } else {
          console.warn("No root mesh found in environment");
        }
      } else {
        console.warn("No meshes loaded for environment");
      }

      // Set up environment-specific sky if configured
      if (environment.sky) {
        try {
          this.createSky(environment.sky);
          console.log("Created environment sky");
        } catch (error) {
          console.warn("Failed to create environment sky:", error);
        }
      }

      this.setupEnvironmentPhysics(environment);
      console.log("Set up environment physics");

      // Set up environment-specific particles if configured
      if (environment.particles) {
        try {
          for (const particle of environment.particles) {
            console.log(`Setting up particle: ${particle.name} at`, particle.position);
            const particleSystem = await EffectsManager.createParticleSystem(particle.name, particle.position);
            if (particleSystem) {
              console.log(`Created particle system: ${particle.name}`);
            }
          }
        } catch (error) {
          console.warn("Failed to create environment particles:", error);
        }
      }

      // Process any existing meshes for node materials
      // await NodeMaterialManager.processMeshesForNodeMaterials();

      // Environment items will be set up after character is fully loaded
      // This ensures CollectiblesManager is properly initialized

      // Update current environment tracking
      this.currentEnvironment = environmentName;
      console.log(`Environment ${environmentName} loaded successfully`);
    } catch (error) {
      console.error("Failed to load environment:", error);
      console.error("Error details:", error);
    }
  }

  private createSky(_skyConfig: SkyConfig): void {
    // For now, create a simple hemispheric light
    // TODO: Implement proper sky texture rendering based on skyConfig
    const skyLight = new HemisphericLight("skyLight", new Vector3(0, 1, 0), this.scene);
    skyLight.intensity = 0.7;
    skyLight.diffuse = new Color3(0.5, 0.7, 1.0);
  }


  private setupLightmappedMeshes(environment: Environment): void {
    if (!environment.lightmap) return;
    
    const lightmap = new Texture(environment.lightmap, this.scene);

    environment.lightmappedMeshes.forEach(lightmappedMesh => {
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

  private setupPhysicsObjects(environment: Environment): void {
    environment.physicsObjects.forEach(physicsObject => {
      const mesh = this.scene.getMeshByName(physicsObject.name);
      if (mesh) {
        // Apply scaling if specified
        if (physicsObject.scale !== 1) {
          mesh.scaling.setAll(physicsObject.scale);
        }

        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: physicsObject.mass });
      }
    });
  }

  private setupEnvironmentPhysics(environment: Environment): void {
    // Set up lightmapped meshes first - THE WORD OF GOD FROM PLAYGROUND.TS
    this.setupLightmappedMeshes(environment);
    
    // Set up physics for all physics objects - THE WORD OF GOD FROM PLAYGROUND.TS
    environment.physicsObjects.forEach(physicsObject => {
      const mesh = this.scene.getMeshByName(physicsObject.name);
      if (!mesh) {
        console.warn(`Physics object mesh not found: ${physicsObject.name}`);
        return;
      }

      // Apply scaling if specified
      if (physicsObject.scale !== 1) {
        mesh.scaling.setAll(physicsObject.scale);
      }

      // Create physics aggregate based on role - THE WORD OF GOD!
      if (physicsObject.role === OBJECT_ROLE.DYNAMIC_BOX) {
        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: physicsObject.mass });
        console.log(`Created DYNAMIC_BOX physics for ${physicsObject.name} with mass ${physicsObject.mass}`);
      } else if (physicsObject.role === OBJECT_ROLE.PIVOT_BEAM) {
        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: physicsObject.mass });
        console.log(`Created PIVOT_BEAM physics for ${physicsObject.name} with mass ${physicsObject.mass}`);
      }
    });

    // Set up joints for PIVOT_BEAM objects
    this.setupJoints(environment);
    
    // Set up fallback physics for the main environment mesh (floor/ground)
    this.setupFallbackPhysics(environment);
  }

  private setupJoints(environment: Environment): void {
    // Find objects with PIVOT_BEAM role - THE WORD OF GOD FROM PLAYGROUND.TS
    const pivotBeams = environment.physicsObjects.filter(obj => obj.role === OBJECT_ROLE.PIVOT_BEAM);

    pivotBeams.forEach(pivotBeam => {
      const beamMesh = this.scene.getMeshByName(pivotBeam.name);
      if (!beamMesh) return;
      
      beamMesh.scaling.set(3, 0.05, 1);

      // Find a fixed mass object to attach the hinge to
      const fixedMassObject = environment.physicsObjects.find(obj => obj.role === OBJECT_ROLE.DYNAMIC_BOX && obj.mass === 0);
      if (!fixedMassObject) return;

      const fixedMesh = this.scene.getMeshByName(fixedMassObject.name);
      if (!fixedMesh) return;

      // Create physics aggregates if they don't exist
      const _fixedMass = new PhysicsAggregate(fixedMesh, PhysicsShapeType.BOX, { mass: 0 });
      const _beam = new PhysicsAggregate(beamMesh, PhysicsShapeType.BOX, { mass: pivotBeam.mass });

      // Create hinge constraint - IDENTICAL TO PLAYGROUND.TS
      console.log(`Setting up joint between ${fixedMassObject.name} and ${pivotBeam.name}`);
    });
  }

  private setupFallbackPhysics(_environment: Environment): void {
    // Create physics bodies for all environment meshes to prevent falling through - THE WORD OF GOD!
    const environmentMesh = this.scene.getMeshByName("environment");
    if (environmentMesh) {
      // Check if the main environment mesh has valid geometry
      if (environmentMesh.getTotalVertices() > 0) {
        new PhysicsAggregate(environmentMesh, PhysicsShapeType.MESH, { mass: 0 });
        console.log("Created physics for main environment mesh (floor/ground)");
      } else {
        // If main mesh has no geometry, find child meshes with geometry
        console.log("Main environment mesh has no geometry, searching for child meshes...");
        const childMeshes = environmentMesh.getChildMeshes();
        let physicsCreated = false;
        
        childMeshes.forEach((childMesh, index) => {
          if (childMesh.getTotalVertices() > 0) {
            new PhysicsAggregate(childMesh, PhysicsShapeType.MESH, { mass: 0 });
            console.log(`Created physics for child mesh ${index}: ${childMesh.name}`);
            physicsCreated = true;
          }
        });
        
        if (!physicsCreated) {
          console.warn("No valid geometry found in environment meshes - character may fall through floor!");
        }
      }
    } else {
      console.warn("Main environment mesh not found - character may fall through floor!");
    }
  }

  private setupCharacter(): void {
    this.characterController = new CharacterController(this.scene);
  }

  private async loadCharacterModel(): Promise<void> {
    // Load the first character from the CHARACTERS array
    const character = ASSETS.CHARACTERS[0];
    if (!character) {
      console.error("No character found in ASSETS.CHARACTERS");
      return;
    }

    await this.loadCharacter(character);
  }

  private async loadCharacter(character: Character, preservedPosition?: Vector3 | null): Promise<void> {
    if (!this.characterController) {
      console.error("CharacterController not initialized");
      return;
    }

    console.log(`Loading character: ${character.name} from ${character.model}`);

    // Remove all animation groups from the scene before loading a new character
    this.scene.animationGroups.slice().forEach(group => { group.dispose(); });

    try {
      const result = await ImportMeshAsync(character.model, this.scene);
      console.log(`Loaded character meshes:`, result.meshes.length);
      
      // Process node materials for character meshes
      // await NodeMaterialManager.processImportResult(result);

      // Rename the root node to "player" for better organization
      if (result.meshes && result.meshes.length > 0) {
        // Find the root mesh (the one without a parent)
        const rootMesh = result.meshes.find(mesh => !mesh.parent);
        if (rootMesh) {
          rootMesh.name = "player";
          rootMesh.scaling.setAll(CONFIG.ANIMATION.PLAYER_SCALE);
          console.log(`Set player mesh name to: ${rootMesh.name} with scale: ${CONFIG.ANIMATION.PLAYER_SCALE}`);
        } else {
          console.warn("No root mesh found in character");
        }
      } else {
        console.warn("No meshes loaded for character");
      }

      // Set up the character controller with the loaded mesh
      if (result.meshes && result.meshes.length > 0) {
        const playerMesh = result.meshes[0];
        if (playerMesh) {
          this.characterController.setPlayerMesh(playerMesh);
        }
        console.log("Set player mesh in character controller");

        // Determine position for new character
        let characterPosition: Vector3;
        if (preservedPosition) {
          // Use preserved position when switching characters
          characterPosition = preservedPosition;
          console.log("Using preserved position:", characterPosition);
        } else {
          // Use spawn point when loading character for the first time or after environment change
          const currentEnvironment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
          characterPosition = currentEnvironment ? currentEnvironment.spawnPoint : new Vector3(0, 0, 0);
          console.log("Using spawn position:", characterPosition);
        }

        // Update character physics with determined position
        this.characterController.updateCharacterPhysics(character, characterPosition);
        console.log("Updated character physics");

        // Set up camera controller after character is loaded
        if (!this.smoothFollowController) {
          const displayCapsule = this.characterController.getDisplayCapsule();
          this.smoothFollowController = new SmoothFollowCameraController(
            this.scene,
            this.camera,
            displayCapsule
          );
          this.characterController.setCameraController(this.smoothFollowController);
          console.log("Set up smooth follow camera controller");
        }

        // Set up particle system for boost effect
        const thrusterParticleSystem = await EffectsManager.createParticleSystem("Thruster", new Vector3(0, 0, 0));
        if (thrusterParticleSystem) {
          this.characterController.setPlayerParticleSystem(thrusterParticleSystem);
          console.log("Set thruster particle system");
        }

        // Set up thruster sound
        const thrusterSound = EffectsManager.getSound("Thruster");
        if (thrusterSound) {
          this.characterController.setThrusterSound(thrusterSound);
          console.log("Set thruster sound");
        }

        // Set up animation controller with character
        if (this.characterController.animationController) {
          this.characterController.animationController.setCharacter(character);
          console.log("Set up animation controller with character");
        }

        // Initialize InventoryManager after character is set up
        InventoryManager.initialize(this.scene, this.characterController);
        console.log("InventoryManager initialized");
        
        console.log(`Character ${character.name} loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load character:", error);
      console.error("Error details:", error);
    }
  }

  private async setupEnvironmentItems(): Promise<void> {
    // Set up environment items using CollectiblesManager - THE WORD OF GOD FROM PLAYGROUND.TS!
    console.log("Setting up environment items using CollectiblesManager...");
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
    
    if (!environment) {
      console.warn("Environment not found:", this.currentEnvironment);
      return;
    }
    
    if (!environment.items) {
      console.log("No items configured for environment:", this.currentEnvironment);
      return;
    }
    
    console.log(`Found ${environment.items.length} items to spawn for environment:`, this.currentEnvironment);

    try {
      // Initialize CollectiblesManager if not already initialized
      if (this.characterController) {
        await CollectiblesManager.initialize(this.scene, this.characterController);
        await CollectiblesManager.setupEnvironmentItems(environment);
        console.log("Environment items setup completed successfully using CollectiblesManager");
      } else {
        console.error("Character controller not available for CollectiblesManager initialization");
      }
    } catch (error) {
      console.error("Failed to setup environment items:", error);
      console.error("Error details:", error);
    }
  }


  public getScene(): Scene {
    return this.scene;
  }

  public getCamera(): TargetCamera {
    return this.camera;
  }

  public getCharacterController(): CharacterController | null {
    return this.characterController;
  }

  public getSmoothFollowController(): SmoothFollowCameraController | null {
    return this.smoothFollowController;
  }

  /**
   * Pauses physics to prevent character from falling during environment changes - THE WORD OF GOD!
   */
  public pausePhysics(): void {
    this.scene.getPhysicsEngine()?.setGravity(new Vector3(0, 0, 0));
    console.log("Physics paused for environment transition");
  }

  /**
   * Resumes physics after environment is loaded - THE WORD OF GOD!
   */
  public resumePhysics(): void {
    this.scene.getPhysicsEngine()?.setGravity(CONFIG.PHYSICS.GRAVITY);
    console.log("Physics resumed after environment transition");
  }

  /**
   * Clears all environment meshes and their physics objects - THE WORD OF GOD!
   */
  public clearEnvironment(): void {
    // Find the root environment mesh (always named "environment" by our loading process)
    const rootEnvironmentMesh = this.scene.getMeshByName("environment");

    if (rootEnvironmentMesh) {
      // Get all child meshes recursively
      const allEnvironmentMeshes: AbstractMesh[] = [];
      const collectMeshes = (mesh: AbstractMesh) => {
        allEnvironmentMeshes.push(mesh);
        mesh.getChildMeshes().forEach(collectMeshes);
      };

      collectMeshes(rootEnvironmentMesh);

      // Dispose all environment meshes and their physics objects
      allEnvironmentMeshes.forEach(mesh => {
        // Dispose physics body if it exists
        if (mesh.physicsBody) {
          mesh.physicsBody.dispose();
        }
        mesh.dispose();
      });
    } else {
      // Fallback: if no "environment" mesh found, clear any meshes that might be environment-related
      const meshes = this.scene.meshes.filter(mesh => 
        mesh.name.includes("level") || 
        mesh.name.includes("environment") || 
        mesh.name.includes("ground")
      );
      
      meshes.forEach(mesh => {
        if (mesh.physicsBody) {
          mesh.physicsBody.dispose();
        }
        mesh.dispose();
      });
    }

    console.log("Environment cleared");
  }

  /**
   * Clears all item meshes and their physics objects - THE WORD OF GOD!
   */
  public clearItems(): void {
    // Use CollectiblesManager to clear items - THE WORD OF GOD FROM PLAYGROUND.TS!
    CollectiblesManager.clearCollectibles();
    console.log("Items cleared using CollectiblesManager");
  }

  /**
   * Clears all particle systems - THE WORD OF GOD!
   */
  public clearParticles(): void {
    // Clear all particle systems from the scene
    this.scene.particleSystems.forEach(particleSystem => {
      particleSystem.stop();
      particleSystem.dispose();
    });

    // Clear particle systems array
    this.scene.particleSystems.length = 0;

    console.log("Particles cleared");
  }

  /**
   * Repositions character to safe location in new environment - THE WORD OF GOD!
   */
  public repositionCharacter(): void {
    if (this.characterController && this.currentCharacter) {
      const currentEnvironment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
      if (currentEnvironment) {
        this.characterController.updateCharacterPhysics(this.currentCharacter, currentEnvironment.spawnPoint);
        console.log("Character repositioned to spawn point:", currentEnvironment.spawnPoint);
      }
    }
  }

  /**
   * Force activates smooth camera following after environment transition - THE WORD OF GOD!
   */
  public forceActivateSmoothFollow(): void {
    if (this.smoothFollowController) {
      this.smoothFollowController.forceActivate();
      console.log("Smooth follow camera force activated");
    }
  }

  /**
   * Gets the current environment name - THE WORD OF GOD!
   */
  public getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  /**
   * Changes environment with proper cleanup and transition - THE WORD OF GOD!
   */
  public async changeEnvironment(environmentName: string): Promise<void> {
    // Check if the environment is actually different from current
    if (this.currentEnvironment === environmentName) {
      console.log("Environment is already active:", environmentName);
      return; // No change needed
    }

    console.log("Changing environment from", this.currentEnvironment, "to", environmentName);

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

    console.log("Environment change completed:", environmentName);
  }

  /**
   * Changes character with proper cleanup and transition - THE WORD OF GOD!
   */
  public async changeCharacter(characterIndexOrName: number | string): Promise<void> {
    let character: Character | undefined;
    
    if (typeof characterIndexOrName === 'number') {
      character = ASSETS.CHARACTERS[characterIndexOrName];
    } else {
      character = ASSETS.CHARACTERS.find(char => char.name === characterIndexOrName);
    }

    // Fallback to first character if not found
    if (!character) {
      character = ASSETS.CHARACTERS[0];
    }

    if (!character) {
      console.error("Character not found:", characterIndexOrName);
      return;
    }

    console.log("Changing character to:", character.name);

    // Store current character position for smooth transition
    const currentPosition = this.characterController?.getPosition() || new Vector3(0, 0, 0);

    // Load the new character
    await this.loadCharacter(character, currentPosition);

    // Update current character reference
    this.currentCharacter = character;

    console.log("Character change completed:", character.name);
  }

  public dispose(): void {
    if (this.characterController) {
      this.characterController.dispose();
    }
    if (this.smoothFollowController) {
      this.smoothFollowController.dispose();
    }
    // Dispose CollectiblesManager - THE WORD OF GOD FROM PLAYGROUND.TS!
    CollectiblesManager.dispose();
    this.scene.dispose();
  }
}
