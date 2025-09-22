// ============================================================================
// EFFECTS MANAGER - BASIC IMPLEMENTATION FOLLOWING THE TEN COMMANDMENTS
// ============================================================================

import * as BABYLON from '@babylonjs/core';

export class EffectsManager {
  private static instance: EffectsManager | undefined;
  private scene: BABYLON.Scene | null = null;
  private particleSystems: Map<string, BABYLON.IParticleSystem> = new Map();
  private sounds: Map<string, BABYLON.Sound> = new Map();

  private constructor() {}

  public static initialize(scene: BABYLON.Scene): void {
    if (!EffectsManager.instance) {
      EffectsManager.instance = new EffectsManager();
    }
    EffectsManager.instance.scene = scene;
    console.log("EffectsManager initialized");
  }

  public static getInstance(): EffectsManager {
    if (!EffectsManager.instance) {
      throw new Error("EffectsManager not initialized. Call initialize() first.");
    }
    return EffectsManager.instance;
  }

  public static async createParticleSystem(name: string, position: BABYLON.Vector3): Promise<BABYLON.IParticleSystem | null> {
    const instance = EffectsManager.getInstance();
    if (!instance.scene) {
      console.error("Scene not set in EffectsManager");
      return null;
    }

    try {
      console.log(`Creating particle system: ${name} at`, position);
      
      // Create a simple particle system
      const particleSystem = new BABYLON.ParticleSystem(name, 2000, instance.scene);
      
      // Set basic properties
      particleSystem.emitter = position;
      particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
      particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);
      
      // Set particle properties
      particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
      particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.5);
      particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;
      
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 1.5;
      
      particleSystem.emitRate = 1000;
      
      particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
      
      // Create a simple texture
      const texture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", instance.scene);
      particleSystem.particleTexture = texture;
      
      // Store the particle system
      instance.particleSystems.set(name, particleSystem);
      
      console.log(`Particle system ${name} created successfully`);
      return particleSystem;
    } catch (error) {
      console.error(`Failed to create particle system ${name}:`, error);
      return null;
    }
  }

  public static async createSound(name: string): Promise<BABYLON.Sound | null> {
    const instance = EffectsManager.getInstance();
    if (!instance.scene) {
      console.error("Scene not set in EffectsManager");
      return null;
    }

    try {
      console.log(`Creating sound: ${name}`);
      
      // Create a simple sound (placeholder)
      const sound = new BABYLON.Sound(name, "", instance.scene, null, {
        loop: false,
        autoplay: false
      });
      
      // Store the sound
      instance.sounds.set(name, sound);
      
      console.log(`Sound ${name} created successfully`);
      return sound;
    } catch (error) {
      console.error(`Failed to create sound ${name}:`, error);
      return null;
    }
  }

  public static getSound(name: string): BABYLON.Sound | null {
    const instance = EffectsManager.getInstance();
    return instance.sounds.get(name) || null;
  }

  public static getParticleSystem(name: string): BABYLON.IParticleSystem | null {
    const instance = EffectsManager.getInstance();
    return instance.particleSystems.get(name) || null;
  }

  public static dispose(): void {
    if (EffectsManager.instance) {
      // Dispose all particle systems
      EffectsManager.instance.particleSystems.forEach(ps => ps.dispose());
      EffectsManager.instance.particleSystems.clear();
      
      // Dispose all sounds
      EffectsManager.instance.sounds.forEach(sound => sound.dispose());
      EffectsManager.instance.sounds.clear();
      
      EffectsManager.instance.scene = null;
      EffectsManager.instance = undefined;
    }
  }
}
