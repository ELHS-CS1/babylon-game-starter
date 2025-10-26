// ============================================================================
// NODE MATERIAL MANAGER
// ============================================================================

export class NodeMaterialManager {
    private static scene: BABYLON.Scene | null = null;
    private static activeNodeMaterials: Map<string, BABYLON.NodeMaterial> = new Map();

    /**
     * Initializes the NodeMaterialManager with a scene
     */
    public static initialize(scene: BABYLON.Scene): void {
        this.scene = scene;
    }

    /**
     * Processes meshes from a model import result
     */
    public static async processImportResult(result: { meshes: BABYLON.AbstractMesh[] }): Promise<void> {
        if (!this.scene) {
            return;
        }

        // Process each mesh for node materials
        for (const mesh of result.meshes) {
            if (mesh.material) {
                // Check if the material is a node material
                if (mesh.material instanceof BABYLON.NodeMaterial) {
                    // Store the node material
                    this.activeNodeMaterials.set(mesh.name, mesh.material);
                }
            }
        }
    }

    /**
     * Processes meshes for node materials
     */
    public static async processMeshesForNodeMaterials(): Promise<void> {
        if (!this.scene) {
            return;
        }

        // Process all meshes in the scene
        for (const mesh of this.scene.meshes) {
            if (mesh.material && mesh.material instanceof BABYLON.NodeMaterial) {
                this.activeNodeMaterials.set(mesh.name, mesh.material);
            }
        }
    }

    /**
     * Gets a node material by name
     */
    public static getNodeMaterial(name: string): BABYLON.NodeMaterial | undefined {
        return this.activeNodeMaterials.get(name);
    }

    /**
     * Gets all active node materials
     */
    public static getActiveNodeMaterials(): Map<string, BABYLON.NodeMaterial> {
        return new Map(this.activeNodeMaterials);
    }

    /**
     * Disposes of the NodeMaterialManager
     */
    public static dispose(): void {
        this.activeNodeMaterials.forEach(material => {
            material.dispose();
        });
        this.activeNodeMaterials.clear();
        this.scene = null;
    }
}
