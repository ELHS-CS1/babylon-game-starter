// ============================================================================
// EFFECTS MANAGER - BASIC IMPLEMENTATION FOLLOWING THE TEN COMMANDMENTS
// ============================================================================

import { Scene, IParticleSystem, Sound, ParticleSystem, Vector3, Color4, Texture } from '@babylonjs/core';

export class EffectsManager {
  private static instance: EffectsManager | undefined;
  private scene: Scene | null = null;
  private particleSystems: Map<string, IParticleSystem> = new Map();
  private sounds: Map<string, Sound> = new Map();

  private constructor() {}

  public static initialize(scene: Scene): void {
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

  public static async createParticleSystem(name: string, position: Vector3): Promise<IParticleSystem | null> {
    const instance = EffectsManager.getInstance();
    if (!instance.scene) {
      console.error("Scene not set in EffectsManager");
      return null;
    }

    try {
      console.log(`Creating particle system: ${name} at`, position);
      
      // Create a simple particle system
      const particleSystem = new ParticleSystem(name, 2000, instance.scene);
      
      // Set basic properties
      particleSystem.emitter = position;
      particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
      particleSystem.maxEmitBox = new Vector3(0.5, 0, 0.5);
      
      // Set particle properties
      particleSystem.color1 = new Color4(1, 1, 1, 1);
      particleSystem.color2 = new Color4(1, 1, 1, 0.5);
      particleSystem.colorDead = new Color4(0, 0, 0, 0);
      
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;
      
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 1.5;
      
      particleSystem.emitRate = 1000;
      
      particleSystem.gravity = new Vector3(0, -9.81, 0);
      
      // Create a simple texture
      const texture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", instance.scene);
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

  public static async createSound(name: string): Promise<Sound | null> {
    const instance = EffectsManager.getInstance();
    if (!instance.scene) {
      console.error("Scene not set in EffectsManager");
      return null;
    }

    try {
      console.log(`Creating sound: ${name}`);
      
      // Create a simple sound (placeholder)
      const sound = new Sound(name, "", instance.scene, null, {
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

  public static getSound(name: string): Sound | null {
    const instance = EffectsManager.getInstance();
    return instance.sounds.get(name) || null;
  }

  public static getParticleSystem(name: string): IParticleSystem | null {
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
