// ============================================================================
// BabylonJS PLAYGROUND V2 - MULTIFILE ENTRY POINT
// ============================================================================

// /// <reference path="./types/babylon.d.ts" />

import { SceneManager } from './managers/SceneManager';
import { SettingsUI } from './ui/SettingsUI';
import { InventoryUI } from './ui/InventoryUI';
import { HUDManager } from './managers/HUDManager';

/**
 * Global cleanup function to remove all UI elements from DOM
 * This prevents orphaned elements when the playground is rerun
 */
function cleanupUI(): void {
    HUDManager.cleanup();
    SettingsUI.cleanup();
    InventoryUI.cleanup();
}

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // Clean up any existing UI elements before creating new ones
        cleanupUI();
        
        const sceneManager = new SceneManager(engine, canvas);

        // Initialize settings UI with scene manager
        SettingsUI.initialize(canvas, sceneManager);

        // Initialize inventory UI with scene manager
        InventoryUI.initialize(canvas, sceneManager);

        return sceneManager.getScene();
    }
}

export { Playground };