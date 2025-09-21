import * as BABYLON from '@babylonjs/core';
import type { Peer } from './Peer';
import { PeerManager } from './Peer';

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
  private currentEnvironment: string = 'levelTest';
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private keys: Record<string, boolean> = {};
  
   
  public onPeerUpdate?: () => void;

  constructor(canvas: HTMLCanvasElement, environment: string = 'levelTest') {
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
    
    // Load environment
    await this.loadEnvironment(this.currentEnvironment);
  }

  private setupLighting(): void {
    // Create a basic lighting setup
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), this.scene);
    directionalLight.intensity = 0.5;
  }

  private setupPhysics(): void {
    // Enable physics with Cannon.js (more reliable for web)
    try {
      this.scene.enablePhysics(CONFIG.PHYSICS.GRAVITY, new BABYLON.CannonJSPlugin());
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
      
      // Map environment names to model URLs
      const environmentModels: Record<string, string> = {
        levelTest: '/assets/models/environments/levelTest/levelTest.glb',
        islandTown: '/assets/models/environments/islandTown/island_town.glb',
        joyTown: '/assets/models/environments/joyTown/joy_town.glb',
        mansion: '/assets/models/environments/mansion/mansion.glb',
        firefoxReality: '/assets/models/environments/firefoxReality/firefox_reality.glb'
      };

      const modelUrl = environmentModels[environmentName];
      if (modelUrl === undefined || modelUrl === '') {
        // Environment not found, using default
        return;
      }

      
      // Load the environment model
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", modelUrl, "", this.scene);
      
      // Position the environment appropriately
      if (result.meshes.length > 0) {
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

    // Handle keyboard input
    this.setupKeyboardControls();
    
    // Handle mouse controls for camera
    this.setupMouseControls();
  }

  private setupKeyboardControls(): void {
    const keys: { [key: string]: boolean } = {};
    
    window.addEventListener('keydown', (event) => {
      keys[event.code] = true;
    });
    
    window.addEventListener('keyup', (event) => {
      keys[event.code] = false;
    });

    // Store keys reference for use in render loop
    // Store keys reference for use in render loop
    this.keys = keys;
  }

  private setupMouseControls(): void {
    let isPointerLocked = false;
    
    this.canvas.addEventListener('click', () => {
      if (!isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === this.canvas;
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (isPointerLocked) {
        const deltaX = event.movementX * CONFIG.CAMERA.DRAG_SENSITIVITY;
        const deltaY = event.movementY * CONFIG.CAMERA.DRAG_SENSITIVITY;
        
        // Rotate camera based on mouse movement
        this.camera.rotation.y -= deltaX;
        this.camera.rotation.x -= deltaY;
        
        // Clamp vertical rotation
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
      }
    });
  }

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
    // Update local player movement
    this.updateLocalPlayer(deltaTime);
    
    // Update camera to follow local player
    this.updateCamera();
    
    // Update remote players
    this.updateRemotePlayers();
  }

  private updateLocalPlayer(deltaTime: number): void {
    if (!this.localPlayer) return;

    const keys = this.keys;
    const moveVector = new BABYLON.Vector3(0, 0, 0);
    
    // Calculate movement based on input
    if (keys['KeyW'] === true || keys['ArrowUp'] === true) {
      moveVector.z += 1;
    }
    if (keys['KeyS'] === true || keys['ArrowDown'] === true) {
      moveVector.z -= 1;
    }
    if (keys['KeyA'] === true || keys['ArrowLeft'] === true) {
      moveVector.x -= 1;
    }
    if (keys['KeyD'] === true || keys['ArrowRight'] === true) {
      moveVector.x += 1;
    }

    // Apply movement
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.scaleInPlace(CONFIG.CHARACTER.SPEED.ON_GROUND * deltaTime * 0.01);
      
      // Rotate movement vector based on camera rotation
      const rotationMatrix = BABYLON.Matrix.RotationY(this.camera.rotation.y);
      moveVector.rotateByQuaternionToRef(BABYLON.Quaternion.FromRotationMatrix(rotationMatrix), moveVector);
      
      this.localPlayer.position.addInPlace(moveVector);
      
      // Update peer data
      const localPeer = this.peerManager.getLocalPeer();
      if (localPeer && this.onPeerUpdate) {
        this.peerManager.updateLocalPeer(
          { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z },
          { x: this.localPlayer.rotation.x, y: this.localPlayer.rotation.y, z: this.localPlayer.rotation.z }
        );
        this.onPeerUpdate(localPeer);
      }
    }
  }

  private updateCamera(): void {
    if (!this.localPlayer) return;

    // Follow the local player with smooth interpolation
    const targetPosition = this.localPlayer.position.add(CONFIG.CAMERA.OFFSET);
    this.camera.position = BABYLON.Vector3.Lerp(
      this.camera.position,
      targetPosition,
      CONFIG.CAMERA.FOLLOW_SMOOTHING
    );
    
    this.camera.setTarget(this.localPlayer.position);
  }

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

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.scene.dispose();
    this.engine.dispose();
  }
}
