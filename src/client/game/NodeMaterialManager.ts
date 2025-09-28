import type { Scene, AbstractMesh } from '@babylonjs/core';
import { NodeMaterial, Mesh } from '@babylonjs/core';
import { logger } from '../utils/logger';

/**
 * NodeMaterialManager - Manages node materials for meshes with #nmSnippetId patterns
 * Matches playground.ts implementation exactly but with logger instead of console
 */
export class NodeMaterialManager {
    private static scene: Scene | null = null;
    private static activeNodeMaterials: Map<string, NodeMaterial> = new Map();

    /**
     * Initializes the NodeMaterialManager with a scene
     * @param scene The Babylon.js scene
     */
    public static initialize(scene: Scene): void {
        this.scene = scene;
    }

    /**
     * Processes all meshes in the scene to look for #nmSnippetId patterns
     * and applies node materials accordingly
     */
    public static async processMeshesForNodeMaterials(): Promise<void> {
        if (!this.scene) {
            logger.warn("NodeMaterialManager not initialized. Call initialize() first.", 'NodeMaterialManager');
            return;
        }

        const meshes = this.scene.meshes;
        for (const mesh of meshes) {
            if (mesh instanceof Mesh) {
                await this.processMeshForNodeMaterial(mesh);
            }
        }
    }

    /**
     * Processes a specific mesh to check for #nmSnippetId pattern and apply node material
     * @param mesh The mesh to process
     */
    public static async processMeshForNodeMaterial(mesh: Mesh): Promise<void> {
        if (!this.scene) {
            logger.warn("NodeMaterialManager not initialized. Call initialize() first.", 'NodeMaterialManager');
            return;
        }

        // Check if mesh name contains #nm pattern
        const nmMatch = mesh.name.match(/#nm([A-Z0-9]+)/);
        if (!nmMatch) {
            return; // No node material snippet ID found
        }

        const snippetId = nmMatch[1];
        const meshName = mesh.name;

        if (!snippetId || snippetId.length === 0) {
            return; // No valid snippet ID found
        }

        try {
            // Check if we already have this node material cached
            let nodeMaterial = this.activeNodeMaterials.get(snippetId);

            if (!nodeMaterial) {
                // Parse the node material from the snippet only if not cached
                nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(snippetId, this.scene);

                if (nodeMaterial) {
                    // Store the node material for reuse
                    this.activeNodeMaterials.set(snippetId, nodeMaterial);
                }
            }

            if (nodeMaterial) {
                // Apply the node material to the mesh
                mesh.material = nodeMaterial;
            } else {
                logger.warn(`Failed to parse node material from snippet "${snippetId}" for mesh "${meshName}"`, 'NodeMaterialManager');
            }
        } catch (error) {
            logger.error(`Failed to apply node material "${snippetId}" to mesh "${meshName}":`, 'NodeMaterialManager');
        }
    }

    /**
     * Processes meshes from a model import result
     * @param result The result from ImportMeshAsync
     */
    public static async processImportResult(result: { meshes: AbstractMesh[] }): Promise<void> {
        if (!this.scene) {
            logger.warn("NodeMaterialManager not initialized. Call initialize() first.", 'NodeMaterialManager');
            return;
        }

        if (result.meshes) {
            for (const mesh of result.meshes) {
                if (mesh instanceof Mesh) {
                    await this.processMeshForNodeMaterial(mesh);
                }
            }
        }
    }

    /**
     * Gets a cached node material by snippet ID
     * @param snippetId The snippet ID
     * @returns The cached node material or null if not found
     */
    public static getCachedNodeMaterial(snippetId: string): NodeMaterial | null {
        return this.activeNodeMaterials.get(snippetId) || null;
    }

    /**
     * Clears all cached node materials
     */
    public static clearCachedNodeMaterials(): void {
        this.activeNodeMaterials.clear();
    }

    /**
     * Gets all active node materials
     * @returns Map of snippet IDs to node materials
     */
    public static getActiveNodeMaterials(): Map<string, NodeMaterial> {
        return new Map(this.activeNodeMaterials);
    }

    /**
     * Disposes all node materials and clears the manager
     */
    public static dispose(): void {
        this.activeNodeMaterials.forEach((nodeMaterial) => {
            nodeMaterial.dispose();
        });
        this.activeNodeMaterials.clear();
        this.scene = null;
    }
}
