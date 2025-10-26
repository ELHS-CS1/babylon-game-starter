// ============================================================================
// SCENE MANAGER
// ============================================================================

// /// <reference path="../types/babylon.d.ts" />

import { CONFIG } from '../config/game-config';
import { ASSETS } from '../config/assets';
import { CharacterController } from '../controllers/CharacterController';
import { SmoothFollowCameraController } from '../controllers/SmoothFollowCameraController';
import { EffectsManager } from './EffectsManager';
import { HUDManager } from './HUDManager';
import { CollectiblesManager } from './CollectiblesManager';
import { InventoryManager } from './InventoryManager';
import { NodeMaterialManager } from './NodeMaterialManager';
import type { Character } from '../types/character';

export class SceneManager {
    private readonly scene: BABYLON.Scene;
    private readonly camera: BABYLON.TargetCamera;
    private characterController: CharacterController | null = null;
    private smoothFollowController: SmoothFollowCameraController | null = null;
    private currentEnvironment: string = "Level Test"; // Track current environment

    constructor(engine: BABYLON.Engine, _canvas: HTMLCanvasElement) {
        this.scene = new BABYLON.Scene(engine);
        this.camera = new BABYLON.TargetCamera("camera1", CONFIG.CAMERA.START_POSITION, this.scene);
        
        this.initializeScene();
    }

    private async initializeScene(): Promise<void> {
        this.setupLighting();
        this.setupPhysics();
        this.setupSky();
        await this.setupEffects();
        await this.loadEnvironment("Level Test");
        this.setupCharacter();
        this.loadCharacterModel();
        await this.setupEnvironmentItems();
        
        // Initialize inventory system
        if (this.characterController) {
            InventoryManager.initialize(this.scene, this.characterController);
        }
    }

    private setupLighting(): void {
        new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    }

    private setupPhysics(): void {
        const hk = new BABYLON.HavokPlugin(false);
        this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, hk);
    }

    private setupSky(): void {
        // Sky will be set up when environment is loaded
    }

    private setupCharacter(): void {
        this.characterController = new CharacterController(this.scene);

        this.smoothFollowController = new SmoothFollowCameraController(
            this.scene,
            this.camera,
            this.characterController.getDisplayCapsule()
        );

        // Connect the character controller to the camera controller
        this.characterController.setCameraController(this.smoothFollowController);
        
        // Initialize HUD
        HUDManager.initialize(this.scene, this.characterController);

        // Initialize Collectibles after character is set up
        CollectiblesManager.initialize(this.scene, this.characterController);
        
        // Force activate smooth follow camera
        this.smoothFollowController.forceActivateSmoothFollow();
    }

    private loadCharacterModel(): void {
        // Load the first character from the CHARACTERS array
        const character = ASSETS.CHARACTERS[0];
        this.loadCharacter(character);
    }

    private loadCharacter(character: Character): void {
        if (!this.characterController) {
            return;
        }

        // Remove all animation groups from the scene before loading a new character
        this.scene.animationGroups.slice().forEach(group => { group.dispose(); });

        BABYLON.ImportMeshAsync(character.model, this.scene)
            .then(async result => {
                // Process node materials for character meshes
                await NodeMaterialManager.processImportResult(result);

                // Rename the root node to "player" for better organization
                if (result.meshes.length > 0) {
                    // Find the root mesh (the one without a parent)
                    const rootMesh = result.meshes.find(mesh => !mesh.parent);
                    if (rootMesh) {
                        rootMesh.name = "player";
                    }
                }

                if (this.characterController) {
                    // Apply character scale to all meshes
                    result.meshes.forEach(mesh => {
                        mesh.scaling.setAll(character.scale);
                    });

                    this.characterController.setPlayerMesh(result.meshes[0]);

                    // Determine position for new character
                    const currentEnvironment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
                    const characterPosition = currentEnvironment?.spawnPoint ?? new BABYLON.Vector3(0, 0, 0);

                    // Update character physics with determined position
                    this.characterController.updateCharacterPhysics(character, characterPosition);

                    // Setup animations using character's animation mapping with fallbacks
                    const walkAnimation = result.animationGroups.find(a => a.name === character.animations.walk) ??
                        result.animationGroups.find(a => a.name.toLowerCase().includes('walk')) ??
                        result.animationGroups.find(a => a.name.toLowerCase().includes('run')) ??
                        result.animationGroups.find(a => a.name.toLowerCase().includes('move'));

                    const idleAnimation = result.animationGroups.find(a => a.name === character.animations.idle) ??
                        result.animationGroups.find(a => a.name.toLowerCase().includes('idle')) ??
                        result.animationGroups.find(a => a.name.toLowerCase().includes('stand'));

                    // Stop animations initially
                    walkAnimation?.stop();
                    idleAnimation?.stop();

                    // Set character in animation controller
                    this.characterController.animationController.setCharacter(character);

                    // Create particle system attached to player mesh
                    const playerParticleSystem = await EffectsManager.createParticleSystem(CONFIG.EFFECTS.DEFAULT_PARTICLE, result.meshes[0]);
                    if (playerParticleSystem) {
                        this.characterController.setPlayerParticleSystem(playerParticleSystem);
                    }

                    // Set up thruster sound for character controller
                    const thrusterSound = EffectsManager.getSound("Thruster");
                    if (thrusterSound) {
                        this.characterController.setThrusterSound(thrusterSound);
                    }
                }
            })
            .catch(_error => {
                // Ignore character loading errors for playground compatibility
            });
    }

    private async setupEffects(): Promise<void> {
        EffectsManager.initialize(this.scene);
        NodeMaterialManager.initialize(this.scene);
        await EffectsManager.createSound("Thruster");
    }


    public getScene(): BABYLON.Scene {
        return this.scene;
    }

    public getCurrentEnvironment(): string {
        return this.currentEnvironment;
    }

    public async loadEnvironment(environmentName: string): Promise<void> {
        const environment = ASSETS.ENVIRONMENTS.find(env => env.name === environmentName);
        if (!environment) {
            return;
        }

        // Clear existing environment particles before creating new ones
        this.clearParticles();
        // Also clear ambient sounds before switching
        EffectsManager.removeAmbientSounds();

        try {
            // Import the environment model
            const result = await BABYLON.ImportMeshAsync(environment.model, this.scene);
            
            // Find the root environment mesh and rename it
            const rootMesh = result.meshes[0];
            rootMesh.name = "environment";

            // Set up physics for environment objects
            for (const physicsObj of environment.physicsObjects) {
                    const mesh = this.scene.getMeshByName(physicsObj.name);
                    if (mesh != null) {
                        // Apply physics properties
                        mesh.scaling = new BABYLON.Vector3(physicsObj.scale, physicsObj.scale, physicsObj.scale);
                    }
                }

            // Set up lighting
            if (environment.lightmap) {
                // Apply lightmap texture to meshes
                const lightmapTexture = new BABYLON.Texture(environment.lightmap, this.scene);
                lightmapTexture.level = 1;
                lightmapTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                
                // Apply to lightmapped meshes
                for (const lightmappedMesh of environment.lightmappedMeshes) {
                        const mesh = this.scene.getMeshByName(lightmappedMesh.name);
                        if (mesh?.material instanceof BABYLON.StandardMaterial) {
                            mesh.material.lightmapTexture = lightmapTexture;
                        }
                    }
            }

            // Ambient sounds setup (positional, looped)
            if (environment.ambientSounds && environment.ambientSounds.length > 0) {
                try {
                    await EffectsManager.setupAmbientSounds(environment.ambientSounds);
                } catch (_error) {
                    // Ignore ambient sound setup errors
                }
            }

            this.currentEnvironment = environmentName;
        } catch (_error) {
            // Ignore environment loading errors for playground compatibility
        }
    }

    public async setupEnvironmentItems(): Promise<void> {
        const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
        if (environment) {
            try {
                await CollectiblesManager.setupEnvironmentItems(environment);
            } catch (_error) {
                // Ignore setup errors for playground compatibility
            }
        }
    }

    public pausePhysics(): void {
        if (this.characterController) {
            this.characterController.pausePhysics();
        }
    }

    public clearEnvironment(): void {
        // Clear all environment-related meshes
        const environmentMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.includes('environment') || 
            mesh.name.includes('ground') || 
            mesh.name.includes('terrain')
        );
        environmentMeshes.forEach(mesh => {
            mesh.dispose();
        });
    }

    public clearItems(): void {
        // Clear all collectible items and interactive objects
        const itemMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.includes('collectible') || 
            mesh.name.includes('item') ||
            mesh.name.includes('pickup')
        );
        itemMeshes.forEach(mesh => {
            mesh.dispose();
        });
    }

    public clearParticles(): void {
        // Clear all particle systems
        EffectsManager.removeAllParticleSystems();
    }

    public repositionCharacter(): void {
        if (this.characterController) {
            // Get the current environment's spawn point
            const environment = ASSETS.ENVIRONMENTS.find(env => env.name === this.currentEnvironment);
            const spawnPoint = environment?.spawnPoint ?? new BABYLON.Vector3(0, 1, 0);
            this.characterController.setPosition(spawnPoint);
        }
    }

    public forceActivateSmoothFollow(): void {
        if (this.smoothFollowController != null) {
            this.smoothFollowController.forceActivateSmoothFollow();
        }
    }

    public resumePhysics(): void {
        if (this.characterController) {
            this.characterController.resumePhysics();
        }
    }

    public dispose(): void {
        if (this.characterController) {
            this.characterController.dispose();
        }
        if (this.smoothFollowController) {
            this.smoothFollowController.dispose();
        }
        EffectsManager.removeAllSounds();
        this.scene.dispose();
    }
}
