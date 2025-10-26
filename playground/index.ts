// ============================================================================
// BabylonJS PLAYGROUND V2 - MULTIFILE ENTRY POINT
// ============================================================================

// /// <reference path="./types/babylon.d.ts" />

import { SceneManager } from './managers/SceneManager';
import { SettingsUI } from './ui/SettingsUI';
import { InventoryUI } from './ui/InventoryUI';

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        const sceneManager = new SceneManager(engine, canvas);

        // Initialize settings UI with scene manager
        SettingsUI.initialize(canvas, sceneManager);

        // Initialize inventory UI with scene manager
        InventoryUI.initialize(canvas, sceneManager);

        return sceneManager.getScene();
    }
}

export { Playground };