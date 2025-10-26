// ============================================================================
// COLLECTIBLES MANAGER
// ============================================================================

import type { CharacterController } from '../controllers/CharacterController';
import type { Environment } from '../types/environment';

export class CollectiblesManager {
    private static scene: BABYLON.Scene | null = null;
    private static characterController: CharacterController | null = null;
    private static collectibles: Map<string, BABYLON.AbstractMesh> = new Map();
    private static collectibleBodies: Map<string, BABYLON.PhysicsBody> = new Map();
    private static collectionSound: BABYLON.Sound | null = null;
    private static totalCredits: number = 0;
    private static collectionObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
    private static collectedItems: Set<string> = new Set();

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
                // Create instances for each collectible
                for (const instance of item.instances) {
                    const collectibleId = `collectible_${item.name}_${instance.position.x}_${instance.position.y}_${instance.position.z}`;
                    
                    // Create collectible mesh
                    if (!this.scene) return;
                    const mesh = BABYLON.MeshBuilder.CreateSphere(collectibleId, { diameter: 0.5, segments: 16 }, this.scene);
                    mesh.position = new BABYLON.Vector3(instance.position.x, instance.position.y, instance.position.z);
                    mesh.name = collectibleId;
                    
                    // Add material
                    const material = new BABYLON.StandardMaterial(`collectible_material_${item.name}`, this.scene);
                    material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
                    mesh.material = material;
                    
                    // Store collectible
                    this.collectibles.set(collectibleId, mesh);
                }
            }
        }
    }

    /**
     * Clears all collectibles
     */
    public static clearCollectibles(): void {
        this.collectibles.forEach(mesh => {
            mesh.dispose();
        });
        this.collectibles.clear();
        this.collectibleBodies.clear();
        this.collectedItems.clear();
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
        this.scene = null;
        this.characterController = null;
    }
}
