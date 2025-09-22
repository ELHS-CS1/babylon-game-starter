import * as BABYLON from '@babylonjs/core';
import type { Peer } from './Peer';
import { PeerManager } from './Peer';
import { CharacterController } from './CharacterController';
import { SmoothFollowCameraController } from './SmoothFollowCameraController';

// CANNON physics is available globally but we use Havok as primary physics engine

// Import the playground modules (we'll need to copy the relevant parts)
// For now, we'll create a simplified version that follows the same patterns

interface GameConfig {
  readonly CHARACTER: {
    readonly HEIGHT: number;
    readonly RADIUS: number;
    readonly SPEED: {
      readonly IN_AIR: number;
      readonly ON_GROUND: number;
      readonly BOOST_MULTIPLIER: number;
    };
    readonly JUMP_HEIGHT: number;
    readonly ROTATION_SPEED: number;
    readonly ROTATION_SMOOTHING: number;
  };
  readonly CAMERA: {
    readonly START_POSITION: BABYLON.Vector3;
    readonly OFFSET: BABYLON.Vector3;
    readonly DRAG_SENSITIVITY: number;
    readonly ZOOM_MIN: number;
    readonly ZOOM_MAX: number;
    readonly FOLLOW_SMOOTHING: number;
  };
  readonly PHYSICS: {
    readonly GRAVITY: BABYLON.Vector3;
    readonly CHARACTER_GRAVITY: BABYLON.Vector3;
  };
}

const CONFIG: GameConfig = {
  CHARACTER: {
    HEIGHT: 1.8,
    RADIUS: 0.6,
    SPEED: {
      IN_AIR: 25.0,
      ON_GROUND: 25.0,
      BOOST_MULTIPLIER: 8.0
    },
    JUMP_HEIGHT: 2.0,
    ROTATION_SPEED: 0.05,
    ROTATION_SMOOTHING: 0.2
  },
  CAMERA: {
    START_POSITION: new BABYLON.Vector3(0, 5, -10),
    OFFSET: new BABYLON.Vector3(0, 1.2, -3),
    DRAG_SENSITIVITY: 0.02,
    ZOOM_MIN: -15,
    ZOOM_MAX: -2,
    FOLLOW_SMOOTHING: 0.1
  },
  PHYSICS: {
    GRAVITY: new BABYLON.Vector3(0, -9.8, 0),
    CHARACTER_GRAVITY: new BABYLON.Vector3(0, -18, 0)
  }
} as const;

export class GameEngine {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.TargetCamera;
  private canvas: HTMLCanvasElement;
  private peerManager: PeerManager;
  private localPlayer: BABYLON.Mesh | null = null;
  private remotePlayers: Map<string, BABYLON.Mesh> = new Map();
  private currentEnvironment: string = 'Level Test';
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private keys: Record<string, boolean> = {};
  
  // Controllers from THE WORD OF GOD
  private characterController: CharacterController | null = null;
  private smoothFollowController: SmoothFollowCameraController | null = null;
   
  public onPeerUpdate?: () => void;

  constructor(canvas: HTMLCanvasElement, environment: string = 'Level Test') {
    this.canvas = canvas;
    this.currentEnvironment = environment;
    this.peerManager = new PeerManager();
    
    // Initialize Babylon.js engine
    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = new BABYLON.TargetCamera("camera1", CONFIG.CAMERA.START_POSITION, this.scene);
    
    this.initializeScene();
    this.setupEventListeners();
    this.startRenderLoop();
  }

  private async initializeScene(): Promise<void> {
    // Setup lighting
    this.setupLighting();
    
    // Setup physics
    this.setupPhysics();
    
    // Setup sky
    this.setupSky();
    
    // Initialize controllers from THE WORD OF GOD
    this.characterController = new CharacterController(this.scene);
    
    // Load environment
    await this.loadEnvironment(this.currentEnvironment);
    
    // Setup camera controller after environment is loaded
    if (this.characterController) {
      const displayCapsule = this.characterController.getDisplayCapsule();
      this.smoothFollowController = new SmoothFollowCameraController(
        this.scene,
        this.camera,
        displayCapsule
      );
      this.characterController.setCameraController(this.smoothFollowController);
    }
  }

  private setupLighting(): void {
    // Create a basic lighting setup
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), this.scene);
    directionalLight.intensity = 0.5;
  }

  private setupPhysics(): void {
    // Enable physics with HavokPlugin according to THE WORD OF GOD
    try {
      const hk = new BABYLON.HavokPlugin(false);
      this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, hk);
    } catch {
      // Failed to enable physics
      // Continue without physics if it fails
    }
  }

  private setupSky(): void {
    // Create a simple skybox
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/images/skies/happy_fluffy_sky.png", this.scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
  }

  private async loadEnvironment(environmentName: string): Promise<void> {
    try {
      
      // Map environment names to model URLs according to THE WORD OF GOD
      const environmentModels: Record<string, string> = {
        'Level Test': 'https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/levelTest/levelTest.glb',
        'Firefox Reality': 'https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/firefoxReality/firefox_reality.glb',
        'Joy Town': 'https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/joyTown/joy_town.glb',
        'Mansion': 'https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/mansion/mansion.glb',
        'Island Town': 'https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/islandTown/island_town.glb'
      };

      const modelUrl = environmentModels[environmentName];
      if (modelUrl === undefined || modelUrl === '') {
        // Environment not found, using default
        return;
      }

      
      // Load the environment model according to THE WORD OF GOD
      const result = await BABYLON.ImportMeshAsync(modelUrl, this.scene);
      
      // Position the environment appropriately
      if (result.meshes.length > 0 && result.meshes[0]) {
        result.meshes[0].position = new BABYLON.Vector3(0, 0, 0);
      }
    } catch {
      // Failed to load environment
      // Don't throw here, let the scene continue with basic setup
    }
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Input is now handled by CharacterController and SmoothFollowCameraController from THE WORD OF GOD
  }

  // Old keyboard and mouse controls removed - now handled by CharacterController and SmoothFollowCameraController from THE WORD OF GOD

  private startRenderLoop(): void {
    const renderLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      // Update game logic
      this.update(deltaTime);
      
      // Render the scene
      this.scene.render();
      
      // Continue the loop
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  private update(deltaTime: number): void {
    // Controllers handle their own updates according to THE WORD OF GOD
    // CharacterController handles character movement and physics
    // SmoothFollowCameraController handles camera following
    
    // Update remote players
    this.updateRemotePlayers();
    
    // Notify peer manager of updates
    if (this.onPeerUpdate) {
      this.onPeerUpdate();
    }
  }

  // Old updateLocalPlayer and updateCamera methods removed - now handled by CharacterController and SmoothFollowCameraController from THE WORD OF GOD

  private updateRemotePlayers(): void {
    // Update remote player positions based on peer data
    const remotePeers = this.peerManager.getAllPeers().filter(peer => 
      !this.peerManager.isLocalPeer(peer.id) && peer.environment === this.currentEnvironment
    );

    remotePeers.forEach(peer => {
      let remotePlayer = this.remotePlayers.get(peer.id);
      
      if (!remotePlayer) {
        // Create remote player mesh
        remotePlayer = this.createPlayerMesh(`remote_${peer.id}`);
        this.remotePlayers.set(peer.id, remotePlayer);
      }
      
      // Update position
      remotePlayer.position = new BABYLON.Vector3(peer.position.x, peer.position.y, peer.position.z);
      remotePlayer.rotation = new BABYLON.Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z);
    });

    // Remove players that are no longer in the environment
    const currentPeerIds = new Set(remotePeers.map(peer => peer.id));
    for (const [peerId, mesh] of this.remotePlayers) {
      if (!currentPeerIds.has(peerId)) {
        mesh.dispose();
        this.remotePlayers.delete(peerId);
      }
    }
  }

  private createPlayerMesh(name: string): BABYLON.Mesh {
    // Create a simple capsule mesh for the player
    const player = BABYLON.MeshBuilder.CreateCapsule(name, {
      radius: CONFIG.CHARACTER.RADIUS,
      height: CONFIG.CHARACTER.HEIGHT
    }, this.scene);
    
    // Create a material
    const material = new BABYLON.StandardMaterial(`${name}_material`, this.scene);
    material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    player.material = material;
    
    return player;
  }

  public createPlayer(name: string): Peer {
    // Create local player mesh
    this.localPlayer = this.createPlayerMesh('local_player');
    
    // Create peer data
    const peer = this.peerManager.createLocalPeer(name, this.currentEnvironment);
    
    return peer;
  }

  public removePlayer(): void {
    if (this.localPlayer) {
      this.localPlayer.dispose();
      this.localPlayer = null;
    }
    
    this.peerManager.clearPeers();
  }

  public setEnvironment(environment: string): void {
    if (this.currentEnvironment !== environment) {
      this.currentEnvironment = environment;
      
      // Clear current environment
      this.scene.meshes.forEach(mesh => {
        if (mesh.name !== 'skyBox' && !mesh.name.startsWith('local_player') && !mesh.name.startsWith('remote_')) {
          mesh.dispose();
        }
      });
      
      // Load new environment
      this.loadEnvironment(environment);
      
      // Update peer environment
      const localPeer = this.peerManager.getLocalPeer();
      if (localPeer) {
        localPeer.environment = environment;
      }
    }
  }

  public addRemotePeer(peer: Peer): void {
    this.peerManager.addRemotePeer(peer);
  }

  public removeRemotePeer(peerId: string): void {
    this.peerManager.removePeer(peerId);
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  public getEngine(): BABYLON.Engine {
    return this.engine;
  }

  public getCharacterController(): CharacterController | null {
    return this.characterController;
  }

  public getSmoothFollowController(): SmoothFollowCameraController | null {
    return this.smoothFollowController;
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose controllers from THE WORD OF GOD
    if (this.characterController) {
      this.characterController.dispose();
    }
    if (this.smoothFollowController) {
      this.smoothFollowController.dispose();
    }
    
    this.scene.dispose();
    this.engine.dispose();
  }
}
