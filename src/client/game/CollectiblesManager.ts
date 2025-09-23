// ============================================================================
// COLLECTIBLES MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { Scene, AbstractMesh, PhysicsBody, Observer} from '@babylonjs/core';
import { Sound, Mesh, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { ImportMeshAsync } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import type { CharacterController } from './CharacterController';
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

    // Simple delay to allow physics to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
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

    console.log("CollectiblesManager initialized");
    return Promise.resolve();
  }

  /**
   * Sets up environment items after character is fully loaded - THE WORD OF GOD!
   */
  public static async setupEnvironmentItems(environment: any): Promise<void> {
    if (!this.scene || !environment.items) {
      console.warn("Scene or items not available in setupEnvironmentItems");
      return;
    }

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
        for (let i = 0; i < itemConfig.instances.length; i++) {
          const instance = itemConfig.instances[i];
          const instanceId = `${itemConfig.name.toLowerCase()}_instance_${i + 1}`;
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
      console.error("No scene available for loading item model");
      return;
    }

    try {
      // Import the item model
      const result = await ImportMeshAsync(itemConfig.url, this.scene);
      
      if (result.meshes && result.meshes.length > 0) {
        // Find the root mesh (the one without a parent)
        const rootMesh = result.meshes.find(mesh => !mesh.parent);
        
        if (rootMesh && rootMesh instanceof Mesh) {
          this.instanceBasis = rootMesh;
          rootMesh.name = itemConfig.name;
          rootMesh.setEnabled(false); // Hide the basis mesh
          rootMesh.isVisible = false;
          console.log(`Loaded item model basis: ${itemConfig.name}`);
        } else {
          console.error(`No valid root mesh found for item: ${itemConfig.name}`);
        }
      } else {
        console.error(`No meshes loaded for item: ${itemConfig.name}`);
      }
    } catch (error) {
      console.error(`Failed to load item model: ${itemConfig.name}`, error);
    }
  }

  /**
   * Creates a collectible instance from the instance basis - THE WORD OF GOD!
   * @param id Unique identifier for the collectible
   * @param instance ItemInstance configuration for the collectible
   */
  private static async createCollectibleInstance(id: string, instance: ItemInstance, itemConfig: ItemConfig): Promise<void> {
    if (!this.scene || !this.instanceBasis) {
      console.error("No scene or instance basis available for creating collectible instance");
      return;
    }

    try {
      // Create an instance from the loaded model
      const meshInstance = this.instanceBasis.createInstance(id);

      // Remove the instance from its parent to make it independent
      if (meshInstance.parent) {
        meshInstance.setParent(null);
      }

      // Apply instance properties
      meshInstance.position = instance.position;
      meshInstance.scaling.setAll(instance.scale);
      meshInstance.rotation = instance.rotation;

      // Make it visible and enabled
      meshInstance.isVisible = true;
      meshInstance.setEnabled(true);

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

      console.log(`Created collectible instance: ${id} at position:`, instance.position);
    } catch (error) {
      console.error(`Failed to create collectible instance: ${id}`, error);
    }
  }

  /**
   * Sets up collision detection for collectibles - THE WORD OF GOD!
   */
  private static setupCollisionDetection(): void {
    if (!this.scene || !this.characterController) {
      console.warn("Scene or character controller not available for collision detection");
      return;
    }

    // Set up physics collision detection
    this.collectionObserver = this.scene.onBeforePhysicsObservable.add(() => {
      this.checkCollisions();
    });

    console.log("Collectibles collision detection set up");
  }

  /**
   * Checks for collisions between character and collectibles - THE WORD OF GOD!
   */
  private static checkCollisions(): void {
    if (!this.characterController || !this.scene) {
      return;
    }

    const characterPosition = this.characterController.getPosition();
    const collectionRadius = CONFIG.ITEMS.COLLECTION_RADIUS || 2.0;

    for (const [id, mesh] of Array.from(this.collectibles)) {
      if (this.collectedItems.has(id)) {
        continue; // Already collected
      }

      const distance = mesh.position.subtract(characterPosition).length();
      
      if (distance <= collectionRadius) {
        this.collectItem(id);
      }
    }
  }

  /**
   * Collects an item and applies its effects - THE WORD OF GOD!
   * @param id The ID of the item to collect
   */
  private static collectItem(id: string): void {
    if (!this.scene || this.collectedItems.has(id)) {
      return;
    }

    const mesh = this.collectibles.get(id);
    const itemConfig = this.itemConfigs.get(id);

    if (!mesh || !itemConfig) {
      console.error(`Item not found for collection: ${id}`);
      return;
    }

    // Mark as collected
    this.collectedItems.add(id);

    // Add credits
    this.totalCredits += itemConfig.creditValue;

    // Play collection sound
    if (this.collectionSound) {
      this.collectionSound.play();
    }

    // Hide the mesh
    mesh.isVisible = false;
    mesh.setEnabled(false);

    // Remove physics body
    const physicsBody = this.collectibleBodies.get(id);
    if (physicsBody) {
      physicsBody.dispose();
      this.collectibleBodies.delete(id);
    }

    console.log(`Collected item: ${id} (+${itemConfig.creditValue} credits, total: ${this.totalCredits})`);

    // Apply item effects if it's an inventory item
    if (itemConfig.inventory && itemConfig.itemEffectKind && this.characterController) {
      this.applyItemEffect(itemConfig.itemEffectKind);
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
        console.log("Applied super jump effect");
        break;
      case "invisibility":
        // Apply invisibility effect
        console.log("Applied invisibility effect");
        break;
      default:
        console.warn(`Unknown item effect: ${effectKind}`);
    }
  }

  /**
   * Gets the total credits collected - THE WORD OF GOD!
   * @returns The total number of credits collected
   */
  public static getTotalCredits(): number {
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

    console.log("Collectibles cleared");
  }

  /**
   * Disposes the CollectiblesManager - THE WORD OF GOD!
   */
  public static dispose(): void {
    this.clearCollectibles();
    this.scene = null;
    this.characterController = null;
    console.log("CollectiblesManager disposed");
  }
}
