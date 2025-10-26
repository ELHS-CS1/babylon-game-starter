// ============================================================================
// SCENE MANAGER
// ============================================================================

/// <reference path="../types/babylon.d.ts" />

import { CONFIG } from '../config/game-config';
import { CharacterController } from '../controllers/CharacterController';
import { SmoothFollowCameraController } from '../controllers/SmoothFollowCameraController';
import { EffectsManager } from './EffectsManager';

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
        this.setupCharacter();
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

    private async setupEffects(): Promise<void> {
        EffectsManager.initialize(this.scene);
        await EffectsManager.createSound("Thruster");
    }

    private setupCharacter(): void {
        this.characterController = new CharacterController(this.scene);
        
        if (this.characterController) {
            this.smoothFollowController = new SmoothFollowCameraController(
                this.scene,
                this.camera,
                this.characterController.getDisplayCapsule()
            );
            this.characterController.setCameraController(this.smoothFollowController);
        }
    }

    public getScene(): BABYLON.Scene {
        return this.scene;
    }

    public getCurrentEnvironment(): string {
        return this.currentEnvironment;
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
