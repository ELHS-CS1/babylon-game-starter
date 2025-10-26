// ============================================================================
// COLLECTIBLES MANAGER
// ============================================================================

import type { CharacterController } from '../controllers/CharacterController';
import type { Environment, ItemConfig, ItemInstance } from '../types/environment';
import { InventoryManager } from './InventoryManager';
import { InventoryUI } from '../ui/InventoryUI';

export class CollectiblesManager {
    private static scene: BABYLON.Scene | null = null;
    private static characterController: CharacterController | null = null;
    private static collectibles: Map<string, BABYLON.AbstractMesh> = new Map();
    private static collectibleBodies: Map<string, BABYLON.PhysicsBody> = new Map();
    private static collectionSound: BABYLON.Sound | null = null;
    private static totalCredits: number = 0;
    private static collectionObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
    private static collectedItems: Set<string> = new Set();
    private static instanceBasis: BABYLON.Mesh | null = null;
    private static itemConfigs: Map<string, ItemConfig> = new Map();
    
    // Cached particle systems for efficiency
    private static cachedParticleSystem: BABYLON.ParticleSystem | null = null;
    private static particleSystemPool: BABYLON.ParticleSystem[] = [];
    private static readonly MAX_POOL_SIZE = 5;

    /**
     * Initializes the CollectiblesManager with a scene and character controller
     */
    public static initialize(scene: BABYLON.Scene, characterController: CharacterController): Promise<void> {
        this.scene = scene;
        this.characterController = characterController;
        this.totalCredits = 0;
        return Promise.resolve();
    }

    /**
     * Sets up environment items for the given environment
     */
    public static async setupEnvironmentItems(environment: Environment): Promise<void> {
        if (!this.scene || !environment.items) {
            return;
        }

        // Clear any existing state
        this.collectibles.clear();
        this.collectibleBodies.clear();
        this.collectedItems.clear();

        // Create collection sound if not already created
        if (!this.collectionSound && this.scene) {
            this.collectionSound = new BABYLON.Sound(
                "collectionSound",
                "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/sounds/effects/collect.m4a",
                this.scene,
                undefined,
                { volume: 0.7 }
            );
        }

        // Set up collectibles for this environment
        await this.setupCollectiblesForEnvironment(environment);
    }

    /**
     * Sets up collectibles for a specific environment
     */
    private static async setupCollectiblesForEnvironment(environment: Environment): Promise<void> {
        if (!environment.items) {
            return;
        }

        for (const item of environment.items) {
            if (item.collectible) {
                // Load the item model first
                await this.loadItemModel(item);

                // Create instances for each collectible
                for (let i = 0; i < item.instances.length; i++) {
                    const instance = item.instances[i];
                    const instanceId = `${item.name.toLowerCase()}_instance_${i + 1}`;
                    await this.createCollectibleInstance(instanceId, instance, item);
                }
            }
        }

        // Set up physics collision detection
        this.setupCollisionDetection();
    }

    /**
     * Loads an item model to use as instance basis
     */
    private static async loadItemModel(itemConfig: ItemConfig): Promise<void> {
        if (!this.scene) {
            return;
        }

        try {
            const result = await BABYLON.ImportMeshAsync(itemConfig.url, this.scene);

            // Process node materials for item meshes
            // await NodeMaterialManager.processImportResult(result);

            // Rename the root node for better organization
            if (result.meshes.length > 0) {
                // Find the root mesh (the one without a parent)
                const rootMesh = result.meshes.find(mesh => !mesh.parent);
                if (rootMesh) {
                    rootMesh.name = `${itemConfig.name.toLowerCase()}_basis`;
                    rootMesh.setEnabled(false);
                }
            }

            // Check if any mesh has proper geometry
            const meshWithGeometry = result.meshes.find(mesh => {
                if (mesh instanceof BABYLON.Mesh) {
                    return mesh.geometry != null && mesh.geometry.getTotalVertices() > 0;
                }
                return false;
            });

            if (meshWithGeometry instanceof BABYLON.Mesh) {
                // Use the first mesh with geometry as the instance basis
                this.instanceBasis = meshWithGeometry;

                // Make the instance basis invisible and disable it in the scene
                this.instanceBasis.isVisible = false;
                this.instanceBasis.setEnabled(false);
            }
        } catch (_error) {
            // Ignore item loading errors for playground compatibility
        }
    }

    /**
     * Creates a collectible instance from the loaded model
     */
    private static async createCollectibleInstance(id: string, instance: ItemInstance, itemConfig: ItemConfig): Promise<void> {
        if (!this.scene || !this.instanceBasis) {
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
            // const boundingBox = meshInstance.getBoundingInfo();
            // const scaledSize = boundingBox.boundingBox.extendSize.scale(2); // Multiply by 2 to get full size

            // Create physics body with dynamic box shape based on scaled dimensions
            const physicsAggregate = new BABYLON.PhysicsAggregate(
                meshInstance,
                BABYLON.PhysicsShapeType.BOX,
                { mass: instance.mass }
            );

            // Store references
            this.collectibles.set(id, meshInstance);
            this.collectibleBodies.set(id, physicsAggregate.body);

            // Store the item config for this collectible
            this.itemConfigs.set(id, itemConfig);

            // Add rotation animation
            this.addRotationAnimation(meshInstance);
        } catch (_error) {
            // Ignore collectible creation errors for playground compatibility
        }
    }

    /**
     * Adds a rotation animation to make collectibles more visible
     */
    private static addRotationAnimation(mesh: BABYLON.AbstractMesh): void {
        if (!this.scene) return;

        const animation = new BABYLON.Animation(
            "rotationAnimation",
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
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
     * Sets up collision detection for collectibles
     */
    private static setupCollisionDetection(): void {
        if (!this.scene || !this.characterController) return;

        // Set up collision detection using scene collision observer
        this.collectionObserver = this.scene.onBeforeRenderObservable.add(() => {
            this.checkCollisions();
        });
    }

    /**
     * Checks for collisions between character and collectibles
     */
    private static checkCollisions(): void {
        if (!this.characterController) return;

        const characterPosition = this.characterController.getDisplayCapsule().position;
        const collectionRadius = 1.5; // Default collection radius

        for (const [id, collectible] of this.collectibles) {
            if (this.collectedItems.has(id)) continue;

            const distance = BABYLON.Vector3.Distance(characterPosition, collectible.position);
            if (distance < collectionRadius) {
                this.collectItem(id);
            }
        }
    }

    /**
     * Collects an item and adds it to inventory
     */
    private static collectItem(id: string): void {
        const collectible = this.collectibles.get(id);
        const itemConfig = this.itemConfigs.get(id);
        
        if (collectible == null || itemConfig == null) return;

        // Mark as collected
        this.collectedItems.add(id);

        // Hide the collectible
        collectible.setEnabled(false);

        // Play collection sound
        if (this.collectionSound) {
            this.collectionSound.play();
        }

        // Show collection effects
        this.showCollectionEffects(collectible.position);

        // Add to inventory only if it's an inventory item
        if (itemConfig.inventory && itemConfig.itemEffectKind && itemConfig.thumbnail) {
            InventoryManager.addItem(itemConfig.name, 1, itemConfig.thumbnail);
            // Refresh inventory UI to show the new item
            InventoryUI.refreshInventory();
        }
        
        // ALWAYS update inventory button opacity after ANY collection
        InventoryUI.updateInventoryButton();

        // Add credits
        this.totalCredits += itemConfig.creditValue;
    }

    /**
     * Creates a reusable particle system template for collection effects
     */
    private static createParticleSystemTemplate(): BABYLON.ParticleSystem {
        if (!this.scene) throw new Error("Scene not initialized");

        const particleSystem = new BABYLON.ParticleSystem("CollectionEffect", 50, this.scene);
        
        particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

        particleSystem.color1 = new BABYLON.Color4(0.5, 0.8, 1, 1); // Baby blue
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.6, 0.9, 1); // Darker baby blue
        particleSystem.colorDead = new BABYLON.Color4(0, 0.3, 0.6, 0); // Fade to dark blue

        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;

        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.8;

        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

        particleSystem.direction1 = new BABYLON.Vector3(-2, -2, -2);
        particleSystem.direction2 = new BABYLON.Vector3(2, 2, 2);

        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.016;

        return particleSystem;
    }

    /**
     * Gets a particle system from the pool or creates a new one
     */
    private static getParticleSystemFromPool(): BABYLON.ParticleSystem | null {
        if (!this.scene) return null;

        // Try to get from pool first
        if (this.particleSystemPool.length > 0) {
            return this.particleSystemPool.pop()!;
        }

        // Create new one if pool is empty
        return this.createParticleSystemTemplate();
    }

    /**
     * Returns a particle system to the pool for reuse
     */
    private static returnParticleSystemToPool(particleSystem: BABYLON.ParticleSystem): void {
        if (this.particleSystemPool.length < this.MAX_POOL_SIZE) {
            particleSystem.stop();
            this.particleSystemPool.push(particleSystem);
        } else {
            particleSystem.dispose();
        }
    }

    /**
     * Shows collection particle effects at the specified position (optimized with pooling)
     */
    private static showCollectionEffects(position: BABYLON.Vector3): void {
        if (!this.scene) return;

        // Get particle system from pool
        const particleSystem = this.getParticleSystemFromPool();
        if (!particleSystem) return;

        // Set position and start
        particleSystem.emitter = position;
        particleSystem.start();

        // Return to pool after effect duration
        setTimeout(() => {
            this.returnParticleSystemToPool(particleSystem);
        }, 1000);
    }

    /**
     * Clears all collectibles
     */
    public static clearCollectibles(): void {
        // Dispose all collectible meshes
        this.collectibles.forEach(mesh => {
            mesh.dispose();
        });
        this.collectibles.clear();
        
        // Dispose all physics bodies
        this.collectibleBodies.forEach(body => {
            if (body) {
                body.dispose();
            }
        });
        this.collectibleBodies.clear();
        
        // Clear collected items tracking
        this.collectedItems.clear();
        
        // Clear item configs
        this.itemConfigs.clear();
        
        // Stop and dispose any active particle systems from collection effects
        this.particleSystemPool.forEach(ps => {
            ps.stop();
            ps.dispose();
        });
        this.particleSystemPool.length = 0;
        
        // Dispose the instance basis mesh
        if (this.instanceBasis) {
            this.instanceBasis.dispose();
            this.instanceBasis = null;
        }
        
        // Remove collision detection observer
        if (this.collectionObserver) {
            this.scene?.onBeforeRenderObservable.remove(this.collectionObserver);
            this.collectionObserver = null;
        }
    }

    /**
     * Gets the total credits collected
     */
    public static getTotalCredits(): number {
        return this.totalCredits;
    }

    /**
     * Disposes of the CollectiblesManager
     */
    public static dispose(): void {
        this.clearCollectibles();
        if (this.collectionObserver) {
            this.scene?.onBeforeRenderObservable.remove(this.collectionObserver);
            this.collectionObserver = null;
        }

        // Dispose collection sound
        if (this.collectionSound) {
            this.collectionSound.dispose();
            this.collectionSound = null;
        }

        // Dispose cached particle system
        if (this.cachedParticleSystem) {
            this.cachedParticleSystem.dispose();
            this.cachedParticleSystem = null;
        }

        // Dispose particle system pool
        this.particleSystemPool.forEach(ps => ps.dispose());
        this.particleSystemPool.length = 0;

        this.scene = null;
        this.characterController = null;
    }
}
