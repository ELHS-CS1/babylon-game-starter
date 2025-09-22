// ============================================================================
// SCENE MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import { 
  Scene, 
  Engine, 
  TargetCamera, 
  HemisphericLight, 
  Vector3, 
  Color3, 
  StandardMaterial, 
  PBRMaterial, 
  Texture 
} from '@babylonjs/core';
import { ImportMeshAsync, PhysicsAggregate, PhysicsShapeType, HavokPlugin, Scalar, Quaternion } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { CharacterController } from './CharacterController';
import { SmoothFollowCameraController } from './SmoothFollowCameraController';
import { EffectsManager } from './EffectsManager';
import { InventoryManager } from './InventoryManager';
import CONFIG from '../config/gameConfig';

// Character interface from THE WORD OF GOD
interface Character {
  name: string;
  model: string;
  animations: {
    idle: string;
    walk: string;
    jump: string;
  };
  height: number;
  radius: number;
  mass: number;
  speed: {
    inAir: number;
    onGround: number;
    boostMultiplier: number;
  };
  jumpHeight: number;
  rotationSpeed: number;
  rotationSmoothing: number;
  animationBlend: number;
  jumpDelay?: number;
}

// Environment interface from THE WORD OF GOD
interface Environment {
  name: string;
  model: string;
  lightmap: string;
  scale: number;
  lightmappedMeshes: Array<{ name: string; level: number }>;
  physicsObjects: Array<{ name: string; mass: number; scale: number; role: string }>;
  sky?: {
    type: string;
    color: Color3;
    intensity: number;
  };
  spawnPoint: Vector3;
  particles?: Array<{ name: string; position: Vector3 }>;
  items?: Array<{ name: string; url: string; position: Vector3 }>;
}

// ASSETS from THE WORD OF GOD
const ASSETS = {
  CHARACTERS: [
    {
      name: "Red",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/amongUs/red.glb",
      animations: {
        idle: "idle",
        walk: "walk",
        jump: "jump",
      },
      height: 1.8,
      radius: 0.6,
      mass: 1.0,
      speed: {
        inAir: 25.0,
        onGround: 25.0,
        boostMultiplier: 8.0
      },
      jumpHeight: 2.0,
      rotationSpeed: 0.05,
      rotationSmoothing: 0.2,
      animationBlend: 200,
      jumpDelay: 200
    },
    {
      name: "Tech Girl",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/techGirl/tech_girl_2.glb",
      animations: {
        idle: "idle",
        walk: "run",
        jump: "jump"
      },
      height: 1.7,
      radius: 0.5,
      mass: 0.8,
      speed: {
        inAir: 30.0,
        onGround: 30.0,
        boostMultiplier: 10.0
      },
      jumpHeight: 2.5,
      rotationSpeed: 0.08,
      rotationSmoothing: 0.15,
      animationBlend: 200,
      jumpDelay: 200
    },
    {
      name: "Zombie",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/zombie/zombie_2.glb",
      animations: {
        idle: "Idle",
        walk: "Run_InPlace",
        jump: "Jump"
      },
      height: 1.9,
      radius: 0.7,
      mass: 1.5,
      speed: {
        inAir: 20.0,
        onGround: 20.0,
        boostMultiplier: 6.0
      },
      jumpHeight: 1.5,
      rotationSpeed: 0.03,
      rotationSmoothing: 0.3,
      animationBlend: 200,
      jumpDelay: 200
    },
    {
      name: "Hulk",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/hulk/hulk.glb",
      animations: {
        idle: "idle",
        walk: "run",
        jump: "jump"
      },
      height: 2.2,
      radius: 0.8,
      mass: 2.0,
      speed: {
        inAir: 15.0,
        onGround: 15.0,
        boostMultiplier: 4.0
      },
      jumpHeight: 1.0,
      rotationSpeed: 0.02,
      rotationSmoothing: 0.4,
      animationBlend: 200,
      jumpDelay: 200
    }
  ] as readonly Character[],
  ENVIRONMENTS: [
    {
      name: "Level Test",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/levelTest/levelTest.glb",
      lightmap: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/levelTest/lightmap.jpg",
      scale: 1,
      lightmappedMeshes: [
        { name: "level_primitive0", level: 1.6 },
        { name: "level_primitive1", level: 1.6 },
        { name: "level_primitive2", level: 1.6 }
      ],
      physicsObjects: [
        { name: "Cube", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.001", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.002", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.003", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.004", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.005", mass: 0.1, scale: 1, role: "DYNAMIC_BOX" },
        { name: "Cube.006", mass: 0.01, scale: 1, role: "PIVOT_BEAM" },
        { name: "Cube.007", mass: 0, scale: 1, role: "DYNAMIC_BOX" }
      ],
      sky: {
        type: "hemispheric",
        color: new Color3(0.5, 0.7, 1.0),
        intensity: 0.7
      },
      spawnPoint: new Vector3(3, 0.5, -8),
      particles: [
        {
          name: "Magic Sparkles",
          position: new Vector3(-2, 0, -8)
        }
      ],
      items: [
        {
          name: "Crate",
          url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/stylized_crate_asset.glb",
          position: new Vector3(2, 0, -5)
        },
        {
          name: "Super Jump",
          url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/jump_collectible.glb",
          position: new Vector3(-5, 0, 3)
        },
        {
          name: "Invisibility",
          url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/invisibility_collectible.glb",
          position: new Vector3(5, 0, 3)
        }
      ]
    },
    {
      name: "Firefox Reality",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/firefoxReality/firefox_reality.glb",
      lightmap: "",
      scale: 1.5,
      lightmappedMeshes: [],
      physicsObjects: [],
      sky: {
        type: "hemispheric",
        color: new Color3(0.8, 0.9, 1.0),
        intensity: 0.8
      },
      spawnPoint: new Vector3(0, 5, 0)
    },
    {
      name: "Joy Town",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/joyTown/joy_town.glb",
      lightmap: "",
      scale: 10,
      lightmappedMeshes: [],
      physicsObjects: [],
      sky: {
        type: "hemispheric",
        color: new Color3(1.0, 0.9, 0.7),
        intensity: 0.9
      },
      spawnPoint: new Vector3(-15, 15, 0)
    },
    {
      name: "Mansion",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/mansion/mansion.glb",
      lightmap: "",
      scale: 10,
      lightmappedMeshes: [],
      physicsObjects: [],
      sky: {
        type: "hemispheric",
        color: new Color3(0.6, 0.6, 0.8),
        intensity: 0.6
      },
      spawnPoint: new Vector3(0, 15, -20)
    },
    {
      name: "Island Town",
      model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/islandTown/island_town.glb",
      lightmap: "",
      scale: 5,
      lightmappedMeshes: [],
      physicsObjects: [],
      sky: {
        type: "hemispheric",
        color: new Color3(0.7, 0.9, 1.0),
        intensity: 0.8
      },
      spawnPoint: new Vector3(0, 10, 0)
    }
  ] as readonly Environment[]
};

export class SceneManager {
  private readonly scene: Scene;
  private readonly camera: TargetCamera;
  private characterController: CharacterController | null = null;
  private smoothFollowController: SmoothFollowCameraController | null = null;
  private currentEnvironment: string = "Level Test"; // Track current environment

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
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
    
    this.loadCharacterModel();
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

  private createSky(skyConfig: { type: string; color: Color3; intensity: number }): void {
    if (skyConfig.type === "hemispheric") {
      const skyLight = new HemisphericLight("skyLight", new Vector3(0, 1, 0), this.scene);
      skyLight.intensity = skyConfig.intensity;
      skyLight.diffuse = skyConfig.color;
    }
  }

  private setupEnvironmentPhysics(environment: Environment): void {
    this.setupLightmappedMeshes(environment);
    this.setupPhysicsObjects(environment);
    this.setupJoints(environment);

    // Fallback: If no physics objects or lightmapped meshes are configured,
    // create physics bodies for all environment meshes to prevent falling through
    if (environment.physicsObjects.length === 0 && environment.lightmappedMeshes.length === 0) {
      this.setupFallbackPhysics(environment);
    }
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

  private setupJoints(environment: Environment): void {
    // Joint setup would go here if needed
  }

  private setupFallbackPhysics(environment: Environment): void {
    // Create physics bodies for all environment meshes to prevent falling through
    const environmentMesh = this.scene.getMeshByName("environment");
    if (environmentMesh) {
      new PhysicsAggregate(environmentMesh, PhysicsShapeType.MESH);
    }
  }

  private clearParticles(): void {
    // Clear existing particles
    this.scene.particleSystems.forEach(ps => ps.dispose());
  }

  private setupCharacter(): void {
    this.characterController = new CharacterController(this.scene);
  }

  private loadCharacterModel(): void {
    // Load the first character from the CHARACTERS array
    const character = ASSETS.CHARACTERS[0];
    if (!character) {
      console.error("No character found in ASSETS.CHARACTERS");
      return;
    }

    this.loadCharacter(character);
  }

  private loadCharacter(character: Character, preservedPosition?: Vector3 | null): void {
    if (!this.characterController) {
      console.error("CharacterController not initialized");
      return;
    }

    console.log(`Loading character: ${character.name} from ${character.model}`);

    // Remove all animation groups from the scene before loading a new character
    this.scene.animationGroups.slice().forEach(group => group.dispose());

    ImportMeshAsync(character.model, this.scene)
      .then(async result => {
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
          this.characterController!.setPlayerMesh(result.meshes[0]);
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
          this.characterController!.updateCharacterPhysics(character, characterPosition);
          console.log("Updated character physics");

          // Set up camera controller after character is loaded
          if (!this.smoothFollowController) {
            const displayCapsule = this.characterController!.getDisplayCapsule();
            this.smoothFollowController = new SmoothFollowCameraController(
              this.scene,
              this.camera,
              displayCapsule
            );
            this.characterController!.setCameraController(this.smoothFollowController);
            console.log("Set up smooth follow camera controller");
          }

          // Set up particle system for boost effect
          const thrusterParticleSystem = await EffectsManager.createParticleSystem("Thruster", new Vector3(0, 0, 0));
          if (thrusterParticleSystem) {
            this.characterController!.setPlayerParticleSystem(thrusterParticleSystem);
            console.log("Set thruster particle system");
          }

          // Set up thruster sound
          const thrusterSound = EffectsManager.getSound("Thruster");
          if (thrusterSound) {
            this.characterController!.setThrusterSound(thrusterSound);
            console.log("Set thruster sound");
          }

          // Set up animation controller with character
          if (this.characterController!.animationController) {
            this.characterController!.animationController.setCharacter(character);
            console.log("Set up animation controller with character");
          }

          // Initialize InventoryManager after character is set up
          InventoryManager.initialize(this.scene, this.characterController!);
          console.log("InventoryManager initialized");
          
          console.log(`Character ${character.name} loaded successfully`);
        }
      })
      .catch(error => {
        console.error("Failed to load character:", error);
        console.error("Error details:", error);
      });
  }

  private async setupEnvironmentItems(): Promise<void> {
    // Set up environment items after character is fully loaded
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
    if (!environment || !environment.items) return;

    try {
      for (const item of environment.items) {
        // Load item model
        const result = await ImportMeshAsync(item.url, this.scene);
        
        if (result.meshes && result.meshes.length > 0) {
          const rootMesh = result.meshes.find(mesh => !mesh.parent);
          if (rootMesh) {
            rootMesh.name = item.name;
            rootMesh.position = item.position;
            
            // Add physics body for collectible items
            new PhysicsAggregate(rootMesh, PhysicsShapeType.BOX, { mass: 0 });
          }
        }
      }
    } catch (error) {
      console.warn("Failed to setup environment items:", error);
    }
  }

  public repositionCharacter(): void {
    if (!this.characterController) return;

    // Use environment spawn point
    const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
    const spawnPoint = environment ? environment.spawnPoint : new Vector3(0, 0, 0);
    
    this.characterController.setPosition(spawnPoint);
    this.characterController.setVelocity(new Vector3(0, 0, 0));
  }

  public forceActivateSmoothFollow(): void {
    if (this.smoothFollowController) {
      this.smoothFollowController.forceActivateSmoothFollow();
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

  public dispose(): void {
    if (this.characterController) {
      this.characterController.dispose();
    }
    if (this.smoothFollowController) {
      this.smoothFollowController.dispose();
    }
    this.scene.dispose();
  }
}
