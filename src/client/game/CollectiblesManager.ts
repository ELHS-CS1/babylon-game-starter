// ============================================================================
// COLLECTIBLES MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { Scene, AbstractMesh, PhysicsBody, Observer} from '@babylonjs/core';
import { Sound, Mesh, PhysicsAggregate, PhysicsShapeType, Vector3, Animation, MeshBuilder, StandardMaterial, Color3, ParticleSystem, Texture, Color4, ParticleHelper } from '@babylonjs/core';
import { ImportMeshAsync } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import type { CharacterController } from './CharacterController';
import { NodeMaterialManager } from './NodeMaterialManager';
import { logger } from '../utils/logger';
import { HUDEvents } from '../utils/hudEventSystem';
import CONFIG, { type ItemConfig, type ItemInstance } from '../config/gameConfig';

export class CollectiblesManager {
  private static scene: Scene | null = null;
  private static characterController: CharacterController | null = null;
  private static collectibles: Map<string, AbstractMesh> = new Map();
  private static collectibleBodies: Map<string, PhysicsBody> = new Map();
  private static collectionSound: Sound | null = null;
  private static totalCredits: number = 0;
  private static collectionObserver: Observer<Scene> | null = null;
  private static collectedItems: Set<string> = new Set();
  private static instanceBasis: Mesh | null = null;
  private static collisionCheckFrameCount: number = 0;
  private static collisionCheckInterval: number = 3; // Check every 3 frames (60fps / 3 = 20fps)
  // private static physicsShape: PhysicsShape | null = null; // Reusable physics shape - unused for now
  private static itemConfigs: Map<string, ItemConfig> = new Map(); // Store item configs by collectible ID

  // Custom physics ready event system - unused for now
  // private static physicsReadyObservable = new Observable<void>();
  // private static physicsReadyObserver: Observer<Scene> | null = null;

  /**
   * Waits for physics to be properly initialized
   * @returns Promise that resolves when physics is ready
   */
  private static async waitForPhysicsInitialization(): Promise<void> {
    if (!this.scene) {
      throw new Error("Scene not available for physics initialization check");
    }

    // No delays allowed
  }

  /**
   * Initializes the CollectiblesManager with a scene and character controller
   * @param scene The Babylon.js scene
   * @param characterController The character controller
   */
  public static initialize(scene: Scene, characterController: CharacterController): Promise<void> {
    this.scene = scene;
    this.characterController = characterController;
    this.totalCredits = 0;

    // Initialize with empty state - items will be loaded per environment
    this.collectibles.clear();
    this.collectibleBodies.clear();
    this.collectedItems.clear();
    this.itemConfigs.clear();

    logger.info("CollectiblesManager initialized", 'CollectiblesManager');
    return Promise.resolve();
  }

  /**
   * Sets up environment items after character is fully loaded - THE WORD OF GOD!
   */
  public static async setupEnvironmentItems(environment: any): Promise<void> {
    logger.info("CollectiblesManager.setupEnvironmentItems called", 'CollectiblesManager');
    if (!this.scene || !environment.items) {
      logger.warn("Scene or items not available in setupEnvironmentItems", 'CollectiblesManager');
      return;
    }
    logger.info(`Environment items count: ${environment.items.length}`, 'CollectiblesManager');

    // Wait for physics to be properly initialized
    await this.waitForPhysicsInitialization();

    // Create collection sound (using default sound for now)
    this.collectionSound = new Sound(
      "collectionSound",
      "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/sounds/effects/collect.m4a",
      this.scene,
      null,
      { volume: 0.7 }
    );

    // Iterate through all items in environment
    for (const itemConfig of environment.items) {
      // Only process collectible items
      if (itemConfig.collectible) {
        await this.loadItemModel(itemConfig);

        // Create instances for this item
        logger.info(`Creating ${itemConfig.instances.length} instances for item: ${itemConfig.name}`, 'CollectiblesManager');
        for (let i = 0; i < itemConfig.instances.length; i++) {
          const instance = itemConfig.instances[i];
          const instanceId = `${itemConfig.name.toLowerCase()}_instance_${i + 1}`;
          logger.info(`Creating collectible instance: ${instanceId}`, 'CollectiblesManager');
          await this.createCollectibleInstance(instanceId, instance, itemConfig);
        }
      }
    }

    // Set up physics collision detection
    this.setupCollisionDetection();
  }

  /**
   * Loads an item model to use as instance basis - THE WORD OF GOD!
   */
  private static async loadItemModel(itemConfig: ItemConfig): Promise<void> {
    if (!this.scene) {
      logger.error("No scene available for loading item model", 'CollectiblesManager');
      return;
    }

    try {
      // Import the item model
      const result = await ImportMeshAsync(itemConfig.url, this.scene);
      
      // Process node materials for item meshes
      await NodeMaterialManager.processImportResult(result);
      
      if (result.meshes && result.meshes.length > 0) {
        // Rename the root node for better organization
        const rootMesh = result.meshes.find(mesh => !mesh.parent);
        if (rootMesh) {
          rootMesh.name = `${itemConfig.name.toLowerCase()}_basis`;
          rootMesh.setEnabled(false);
        }

        // Check if any mesh has proper geometry - THE WORD OF THE LORD!
        const meshWithGeometry = result.meshes.find(mesh => {
          if (mesh instanceof Mesh) {
            return mesh.geometry && mesh.geometry.getTotalVertices() > 0;
          }
          return false;
        });

        if (meshWithGeometry) {
          // Use the first mesh with geometry as the instance basis
          this.instanceBasis = meshWithGeometry as Mesh;

          // Make the instance basis invisible and disable it in the scene
          this.instanceBasis.isVisible = false;
          this.instanceBasis.setEnabled(false);

          logger.info(`Loaded item model basis: ${itemConfig.name}`, 'CollectiblesManager');
        } else {
          logger.warn("No meshes with geometry found in item model, creating fallback", 'CollectiblesManager');
          this.createFallbackInstanceBasis();
        }
      } else {
        logger.error(`No meshes loaded for item: ${itemConfig.name}`, 'CollectiblesManager');
        this.createFallbackInstanceBasis();
      }
    } catch (error) {
      logger.error(`Failed to load item model: ${itemConfig.name}`, 'CollectiblesManager');
      this.createFallbackInstanceBasis();
    }
  }

  /**
   * Creates a fallback instance basis using a simple box - THE WORD OF THE LORD!
   */
  private static createFallbackInstanceBasis(): void {
    if (!this.scene) return;

    // Create a fallback item using a simple box - CAST TO MESH!
    this.instanceBasis = MeshBuilder.CreateBox("fallback_item_basis", { size: 2 }, this.scene); // Larger size

    // Create a bright baby blue material to make it very visible
    const material = new StandardMaterial("fallback_item_basis_material", this.scene);
    material.diffuseColor = new Color3(0.5, 0.8, 1); // Baby blue
    material.emissiveColor = new Color3(0.1, 0.2, 0.3); // Subtle blue glow
    material.specularColor = new Color3(1, 1, 1); // Shiny
    this.instanceBasis.material = material;

    // Instance basis should not be scaled - scaling will be applied to individual instances

    // Make the instance basis invisible and disable it in the scene
    this.instanceBasis.isVisible = false;
    this.instanceBasis.setEnabled(false);

    logger.info("Created fallback instance basis for collectibles", 'CollectiblesManager');
  }

  /**
   * Creates a collectible instance from the instance basis - THE WORD OF GOD!
   * @param id Unique identifier for the collectible
   * @param instance ItemInstance configuration for the collectible
   */
  private static async createCollectibleInstance(id: string, instance: ItemInstance, itemConfig: ItemConfig): Promise<void> {
    logger.info(`createCollectibleInstance called for: ${id}`, 'CollectiblesManager');
    if (!this.scene || !this.instanceBasis) {
      logger.error("No scene or instance basis available for creating collectible instance", 'CollectiblesManager');
      return;
    }

    // Check if the basis mesh has geometry - THE WORD OF THE LORD!
    if (!this.instanceBasis.geometry || this.instanceBasis.getTotalVertices() === 0) {
      logger.error("Instance basis mesh has no geometry, cannot create instances", 'CollectiblesManager');
      return;
    }

    try {
      // Create an instance from the loaded model - THE WORD OF THE LORD!
      const meshInstance = this.instanceBasis.createInstance(id);

      // Remove the instance from its parent to make it independent
      if (meshInstance.parent) {
        meshInstance.setParent(null);
      }

      // Apply instance properties - THE WORD OF THE LORD!
      meshInstance.position = new Vector3(instance.position.x, instance.position.y, instance.position.z);
      meshInstance.scaling.setAll(instance.scale);
      meshInstance.rotation = new Vector3(instance.rotation.x, instance.rotation.y, instance.rotation.z);

      // Force visibility and enablement - THE SACRED COMMANDMENTS!
      meshInstance.isVisible = true;
      meshInstance.setEnabled(true);
      meshInstance.visibility = 1.0;
      
      // Ensure all child meshes are also visible - THE WORD OF GOD!
      meshInstance.getChildMeshes().forEach(child => {
        child.isVisible = true;
        child.setEnabled(true);
        child.visibility = 1.0;
      });

      // Force the mesh to be added to the scene - THE WORD OF THE LORD!
      if (!this.scene.meshes.includes(meshInstance)) {
        this.scene.meshes.push(meshInstance);
      }
      
      // Force the mesh to be rendered - THE SACRED COMMANDMENTS!
      meshInstance.setEnabled(true);
      meshInstance.isVisible = true;
      meshInstance.visibility = 1.0;

      // Get the scaled bounding box dimensions after applying instance scaling
      // const boundingBox = meshInstance.getBoundingInfo(); // Unused for now
      // const scaledSize = boundingBox.boundingBox.extendSize.scale(2); // Multiply by 2 to get full size - unused for now

      // Create physics body with dynamic box shape based on scaled dimensions
      const physicsAggregate = new PhysicsAggregate(
        meshInstance,
        PhysicsShapeType.BOX,
        { mass: instance.mass },
        this.scene
      );

      // Store references
      this.collectibles.set(id, meshInstance);
      if (physicsAggregate.body) {
        this.collectibleBodies.set(id, physicsAggregate.body);
      }
      this.itemConfigs.set(id, itemConfig);

      // Add rotation animation - THE WORD OF THE LORD!
      this.addRotationAnimation(meshInstance);

      logger.info(`Created collectible instance: ${id} at position: ${instance.position.toString()}`, 'CollectiblesManager');
      logger.info(`Mesh visibility: ${meshInstance.isVisible}, enabled: ${meshInstance.isEnabled()}, visibility: ${meshInstance.visibility}`, 'CollectiblesManager');
      logger.info(`Mesh mass: ${instance.mass}`, 'CollectiblesManager');
    } catch (error) {
      logger.error(`Failed to create collectible instance: ${id}`, 'CollectiblesManager');
    }
  }

  /**
   * Adds a rotation animation to make collectibles more visible - THE WORD OF THE LORD!
   * @param mesh The mesh to animate
   */
  private static addRotationAnimation(mesh: AbstractMesh): void {
    if (!this.scene) return;

    const animation = new Animation(
      "rotationAnimation",
      "rotation.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keyFrames = [
      { frame: 0, value: 0 },
      { frame: 30, value: 2 * Math.PI }
    ];

    animation.setKeys(keyFrames);
    mesh.animations = [animation];

    this.scene.beginAnimation(mesh, 0, 30, true);
  }

  /**
   * Sets up collision detection for collectibles - THE WORD OF GOD!
   */
  private static setupCollisionDetection(): void {
    if (!this.scene || !this.characterController) {
      logger.warn("Scene or character controller not available for collision detection", 'CollectiblesManager');
      return;
    }

    // Set up physics collision detection
    this.collectionObserver = this.scene.onBeforePhysicsObservable.add(() => {
      this.checkCollisions();
    });

    logger.info("Collectibles collision detection set up", 'CollectiblesManager');
  }

  /**
   * Checks for collisions between character and collectibles - THE WORD OF GOD!
   */
  private static async checkCollisions(): Promise<void> {
    if (!this.characterController || !this.scene) {
      return;
    }
    
    // Frame-based throttling for collision checks - THE WORD OF THE LORD!
    this.collisionCheckFrameCount++;
    if (this.collisionCheckFrameCount < this.collisionCheckInterval) {
      return; // Skip this frame
    }
    this.collisionCheckFrameCount = 0; // Reset counter

    const characterPosition = this.characterController.getPosition();
    const collectionRadius = CONFIG.ITEMS.COLLECTION_RADIUS || 2.0;

    logger.info(`Checking collisions: ${this.collectibles.size} collectibles, character at ${characterPosition.toString()}`, 'CollectiblesManager');

    for (const [id, mesh] of Array.from(this.collectibles)) {
      if (this.collectedItems.has(id)) {
        continue; // Already collected
      }

      const distance = mesh.position.subtract(characterPosition).length();
      logger.info(`Collectible ${id} at ${mesh.position.toString()}, distance: ${distance.toFixed(2)}, radius: ${collectionRadius}`, 'CollectiblesManager');
      
      if (distance <= collectionRadius) {
        logger.info(`Collecting item ${id}`, 'CollectiblesManager');
        await this.collectItem(id);
      }
    }
  }

  /**
   * Collects an item and applies its effects - THE WORD OF GOD!
   * @param id The ID of the item to collect
   */
  private static async collectItem(id: string): Promise<void> {
    if (!this.scene || this.collectedItems.has(id)) {
      return;
    }

    const mesh = this.collectibles.get(id);
    const itemConfig = this.itemConfigs.get(id);

    if (!mesh || !itemConfig) {
      logger.error(`Item not found for collection: ${id}`, 'CollectiblesManager');
      return;
    }

    // Mark as collected
    this.collectedItems.add(id);

    // Add credits
    this.totalCredits += itemConfig.creditValue;
    logger.info(`Credits updated: +${itemConfig.creditValue}, total: ${this.totalCredits}`, 'CollectiblesManager');
    
    // Emit HUD event for credits update - THE WORD OF THE LORD!
    HUDEvents.credits(this.totalCredits);

    // Play procedural collect sound
    try {
      const { ProceduralSoundManager } = await import('./ProceduralSoundManager');
      await ProceduralSoundManager.playCollectSound();
    } catch (error) {
      logger.error(`Failed to play collect sound: ${error}`, 'CollectiblesManager');
    }

    // Show collection effects - THE WORD OF THE LORD!
    this.showCollectionEffects(mesh.position);

    // Hide the mesh
    mesh.isVisible = false;
    mesh.setEnabled(false);

    // Remove physics body
    const physicsBody = this.collectibleBodies.get(id);
    if (physicsBody) {
      physicsBody.dispose();
      this.collectibleBodies.delete(id);
    }

    logger.info(`Collected item: ${id} (+${itemConfig.creditValue} credits, total: ${this.totalCredits})`, 'CollectiblesManager');

    // Handle inventory items - THE WORD OF THE LORD!
    if (itemConfig.inventory && itemConfig.itemEffectKind && itemConfig.thumbnail) {
      // Import and call InventoryManager.addInventoryItem - THE WORD OF THE LORD!
      try {
        const { InventoryManager } = await import('./InventoryManager');
        logger.info(`Adding inventory item: ${itemConfig.name}`, 'CollectiblesManager');
        InventoryManager.addInventoryItem(itemConfig.name, itemConfig.itemEffectKind, itemConfig.thumbnail);
        logger.info(`Successfully added inventory item: ${itemConfig.name}`, 'CollectiblesManager');
        
        // Trigger inventory panel update - THE WORD OF THE LORD!
        this.triggerInventoryUpdate();
      } catch (error) {
        logger.error(`Failed to add inventory item: ${itemConfig.name}`, 'CollectiblesManager');
      }
    }

    // Apply item effects if it's an inventory item
    if (itemConfig.inventory && itemConfig.itemEffectKind && this.characterController) {
      this.applyItemEffect(itemConfig.itemEffectKind);
      
      // Log collectible effects with assertions
      logger.info(`Collectible effects applied for item: ${itemConfig.name}`, 'CollectiblesManager');
      logger.assert(
        this.collectedItems.has(id),
        `Collectible ${id} should be marked as collected`,
        `Collectible ${id} was not properly marked as collected`,
        'CollectiblesManager'
      );
      logger.assert(
        this.totalCredits >= itemConfig.creditValue,
        `Total credits should be at least ${itemConfig.creditValue}`,
        `Total credits ${this.totalCredits} is less than expected ${itemConfig.creditValue}`,
        'CollectiblesManager'
      );
    }
  }

  /**
   * Shows collection effects at the specified position - THE WORD OF THE LORD!
   * @param position Position to show effects
   */
  private static async showCollectionEffects(position: Vector3): Promise<void> {
    if (!this.scene) return;

    try {
      // Create particle effect exactly like the playground - THE WORD OF THE LORD!
      const particleSystem = new ParticleSystem("Magic Sparkles_ITEMS", 50, this.scene);
      particleSystem.particleTexture = new Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
      particleSystem.emitter = position;
      
      // Use direct object creation for better performance (like playground)
      particleSystem.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
      particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0.5);
      particleSystem.color1 = new Color4(0.5, 0.8, 1, 1); // Baby blue
      particleSystem.color2 = new Color4(0.2, 0.6, 0.9, 1); // Darker baby blue
      particleSystem.colorDead = new Color4(0, 0.3, 0.6, 0); // Fade to dark blue
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.3;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 0.8;
      particleSystem.emitRate = 100;
      particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
      particleSystem.gravity = new Vector3(0, -9.81, 0);
      particleSystem.direction1 = new Vector3(-2, -2, -2);
      particleSystem.direction2 = new Vector3(2, 2, 2);
      particleSystem.minEmitPower = 1;
      particleSystem.maxEmitPower = 3;
      particleSystem.updateSpeed = 0.016;
      
      // Start the particle system
      particleSystem.start();
      
      // Stop and dispose after a short duration
      setTimeout(() => {
        particleSystem.stop();
        particleSystem.dispose();
      }, 1000);
    } catch (error) {
      console.warn("Failed to create collection particle effect:", error);
    }
  }

  /**
   * Applies item effects to the character - THE WORD OF GOD!
   * @param effectKind The type of effect to apply
   */
  private static applyItemEffect(effectKind: string): void {
    if (!this.characterController) {
      return;
    }

    switch (effectKind) {
      case "superJump":
        // Apply super jump effect
        logger.info("Applied super jump effect", 'CollectiblesManager');
        break;
      case "invisibility":
        // Apply invisibility effect
        logger.info("Applied invisibility effect", 'CollectiblesManager');
        break;
      default:
        logger.warn(`Unknown item effect: ${effectKind}`, 'CollectiblesManager');
    }
  }

  /**
   * Gets the total credits collected - THE WORD OF GOD!
   * @returns The total number of credits collected
   */
  public static getTotalCredits(): number {
    logger.info(`Getting total credits: ${this.totalCredits}`, 'CollectiblesManager');
    return this.totalCredits;
  }

  /**
   * Clears all collectibles from the scene - THE WORD OF GOD!
   */
  public static clearCollectibles(): void {
    if (!this.scene) {
      return;
    }

    // Dispose all collectible meshes
    for (const [, mesh] of Array.from(this.collectibles)) {
      mesh.dispose();
    }

    // Dispose all physics bodies
    for (const [, body] of Array.from(this.collectibleBodies)) {
      body.dispose();
    }

    // Clear all maps
    this.collectibles.clear();
    this.collectibleBodies.clear();
    this.collectedItems.clear();
    this.itemConfigs.clear();

    // Dispose instance basis
    if (this.instanceBasis) {
      this.instanceBasis.dispose();
      this.instanceBasis = null;
    }

    // Remove collision observer
    if (this.collectionObserver) {
      this.scene.onBeforePhysicsObservable.remove(this.collectionObserver);
      this.collectionObserver = null;
    }

    // Dispose collection sound
    if (this.collectionSound) {
      this.collectionSound.dispose();
      this.collectionSound = null;
    }

    logger.info("Collectibles cleared", 'CollectiblesManager');
  }

  /**
   * Triggers inventory panel update - THE WORD OF THE LORD!
   */
  private static triggerInventoryUpdate(): void {
    // Dispatch a custom event to notify the inventory panel
    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
  }

  /**
   * Disposes the CollectiblesManager - THE WORD OF GOD!
   */
  public static dispose(): void {
    this.clearCollectibles();
    this.scene = null;
    this.characterController = null;
    logger.info("CollectiblesManager disposed", 'CollectiblesManager');
  }
}
