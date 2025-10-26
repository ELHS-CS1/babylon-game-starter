// ============================================================================
// anyJS PLAYGROUND V2 - MULTIFILE ENTRY POINT
// ============================================================================

/// <reference path="./types/babylon.d.ts" />

import { SceneManager } from './managers/SceneManager';

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        const sceneManager = new SceneManager(engine, canvas);
        return sceneManager.getScene();
    }
}

export { Playground };