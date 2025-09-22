// ============================================================================
// GAME ENGINE - FOLLOWING THE WORD OF THE LORD FROM PLAYGROUND.TS
// ============================================================================

import { Engine, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, Scene } from '@babylonjs/core';
import type { Peer } from './Peer';
import { PeerManager } from './Peer';
import { SceneManager } from './SceneManager';

export class GameEngine {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private peerManager: PeerManager;
  private sceneManager: SceneManager | null = null;
  private remotePlayers: Map<string, Mesh> = new Map();
  private currentEnvironment: string = 'Level Test';
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
   
  public onPeerUpdate?: () => void;

  constructor(canvas: HTMLCanvasElement, environment: string = 'Level Test') {
    console.log("GameEngine constructor called with environment:", environment);
    
    this.canvas = canvas;
    this.currentEnvironment = environment;
    this.peerManager = new PeerManager();
    
    // Initialize Babylon.js engine
    this.engine = new Engine(canvas, true);
    console.log("Babylon.js engine created");
    
    // Create SceneManager according to THE WORD OF THE LORD
    try {
      this.sceneManager = new SceneManager(this.engine, canvas);
      console.log("SceneManager created successfully");
    } catch (error) {
      console.error("Failed to create SceneManager:", error);
    }
    
    this.setupEventListeners();
    this.startRenderLoop();
    console.log("GameEngine initialization complete");
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Input is now handled by CharacterController and SmoothFollowCameraController from THE WORD OF THE LORD
  }

  private startRenderLoop(): void {
    const renderLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      // Update game logic
      this.update(deltaTime);
      
      // Render the scene
      if (this.sceneManager) {
        this.sceneManager.getScene().render();
      }
      
      // Continue the loop
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  private update(deltaTime: number): void {
    // Controllers handle their own updates according to THE WORD OF THE LORD
    // CharacterController handles character movement and physics
    // SmoothFollowCameraController handles camera following
    
    // Update remote players
    this.updateRemotePlayers();
    
    // Notify peer manager of updates
    if (this.onPeerUpdate) {
      this.onPeerUpdate();
    }
  }

  private updateRemotePlayers(): void {
    if (!this.sceneManager) return;
    
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
            remotePlayer.position = new Vector3(peer.position.x, peer.position.y, peer.position.z);
            remotePlayer.rotation = new Vector3(peer.rotation.x, peer.rotation.y, peer.rotation.z);
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

  private createPlayerMesh(name: string): Mesh {
    if (!this.sceneManager) {
      throw new Error('SceneManager not initialized');
    }
    
    const scene = this.sceneManager.getScene();
    
    // Create a simple capsule mesh for the player
    const player = MeshBuilder.CreateCapsule(name, {
      radius: 0.6,
      height: 1.8
    }, scene);
    
    // Create a material
    const material = new StandardMaterial(`${name}_material`, scene);
    material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
    player.material = material;
    
    return player;
  }

  public setEnvironment(environment: string): void {
    if (this.currentEnvironment !== environment && this.sceneManager) {
      this.currentEnvironment = environment;
      
      // Load new environment using SceneManager
      this.sceneManager.loadEnvironment(environment);
      
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

  public getScene(): Scene | null {
    return this.sceneManager ? this.sceneManager.getScene() : null;
  }

  public getEngine(): Engine {
    return this.engine;
  }

  public getCharacterController() {
    return this.sceneManager ? this.sceneManager.getCharacterController() : null;
  }

  public getSmoothFollowController() {
    return this.sceneManager ? this.sceneManager.getSmoothFollowController() : null;
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose SceneManager from THE WORD OF THE LORD
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
    
    this.engine.dispose();
  }
}