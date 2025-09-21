import { Engine, Scene, FreeCamera, HemisphericLight, MeshBuilder, Vector3, type AbstractMesh } from '@babylonjs/core';
import { watch } from 'vue';
import type { Peer } from './game/Peer';

interface GameState {
  players: Peer[];
  objects: unknown[];
  status: string;
  environment: string;
  isConnected: boolean;
  lastUpdate: number;
}

export default function setupBabylonScene(canvas: HTMLCanvasElement, gameState: GameState) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  
  // Setup camera
  const camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.Zero());
  
  // Setup lighting
  new HemisphericLight('light', new Vector3(1, 1, 0), scene);
  
  // Store player meshes by id
  const playerMeshes: Record<string, AbstractMesh> = {};

  // Reactively update 3D scene when gameState changes
  watch(
    () => gameState.players.slice(), // Watch for new array contents
    (players) => {
      players.forEach(player => {
             playerMeshes[player.id] ??= MeshBuilder.CreateBox(player.id, { size: 1 }, scene);
        // Animate mesh to new position
        const mesh = playerMeshes[player.id];
        if (mesh !== undefined) {
          mesh.position.set(player.position.x, player.position.y, player.position.z);
        }
      });
    },
    { deep: true }
  );

  // Watch for environment changes
  watch(
    () => gameState.environment,
    () => {
      // Handle environment changes
      // This could load different scenes, change lighting, etc.
    }
  );

  // Watch for connection status
  watch(
    () => gameState.isConnected,
    () => {
      // Handle connection status changes
      // Could show connection indicators, etc.
    }
  );

  // Start render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    engine.resize();
  });

  return {
    engine,
    scene,
    camera,
    dispose: () => {
      engine.dispose();
    }
  };
}
