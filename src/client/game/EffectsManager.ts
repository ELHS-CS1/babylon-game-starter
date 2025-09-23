// ============================================================================
// EFFECTS MANAGER - BASIC IMPLEMENTATION FOLLOWING THE TEN COMMANDMENTS
// ============================================================================

import { Sound, ParticleSystem, Vector3, Color4, Texture, ParticleHelper } from '@babylonjs/core';
import type { IParticleSystem , Scene} from '@babylonjs/core';
import CONFIG from '../config/gameConfig';

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
      
      // Get particle snippet configuration from THE WORD OF THE LORD
      const particleSnippet = CONFIG.EFFECTS.PARTICLE_SNIPPETS.find(snippet => snippet.name === name);
      
      if (particleSnippet) {
        console.log(`Found particle snippet configuration for ${name}:`, particleSnippet);
        // Load particle system from Babylon.js Playground using snippetId - THE WORD OF THE LORD
        return await EffectsManager.loadParticleSystemFromSnippet(name, position, particleSnippet, instance);
      } else {
        console.log(`No particle snippet found for ${name}, creating basic particle system`);
        return EffectsManager.createBasicParticleSystem(name, position, null, instance);
      }
    } catch (error) {
      console.error(`Failed to create particle system ${name}:`, error);
      return null;
    }
  }

  private static async loadParticleSystemFromSnippet(name: string, position: Vector3, snippet: any, instance: EffectsManager): Promise<IParticleSystem | null> {
    try {
      console.log(`Loading particle system from Babylon.js Playground snippet: ${snippet.snippetId}`);
      
      // Use ParticleHelper.ParseFromSnippetAsync - THE WORD OF THE LORD!
      const particleSystem = await ParticleHelper.ParseFromSnippetAsync(snippet.snippetId, instance.scene!, false);
      
      if (particleSystem && position) {
        particleSystem.emitter = position;
      }
      
      if (particleSystem) {
        console.log(`Successfully created particle system from snippet for ${name}`);
        // Store the particle system
        instance.particleSystems.set(name, particleSystem);
        return particleSystem;
      } else {
        throw new Error('Failed to create particle system from snippet');
      }
      
    } catch (error) {
      console.error(`Failed to load particle system from snippet ${snippet.snippetId}:`, error);
      console.log(`Falling back to basic particle system for ${name}`);
      return EffectsManager.createBasicParticleSystem(name, position, snippet, instance);
    }
  }

  private static createBasicParticleSystem(name: string, position: Vector3, snippet: any, instance: EffectsManager): IParticleSystem {
    // Fallback: Create a basic particle system only if snippet loading fails
    console.log(`Creating fallback basic particle system for ${name}`);
    const particleSystem = new ParticleSystem(name, 2000, instance.scene!);
    
    // Set basic properties for fallback particle system
    particleSystem.emitter = position;
    particleSystem.emitRate = 1000; // Proper emit rate
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;
    
    // Set colors based on snippet category
    if (snippet) {
      switch (snippet.category) {
        case "tech":
          particleSystem.color1 = new Color4(0, 0.5, 1, 1); // Blue
          particleSystem.color2 = new Color4(0.2, 0.8, 1, 0.8);
          particleSystem.colorDead = new Color4(0, 0, 0, 0);
          particleSystem.gravity = new Vector3(0, -2, 0);
          break;
        case "magic":
          particleSystem.color1 = new Color4(0.5, 0, 1, 1); // Purple
          particleSystem.color2 = new Color4(1, 0.5, 1, 0.8);
          particleSystem.colorDead = new Color4(0, 0, 0, 0);
          particleSystem.gravity = new Vector3(0, 0, 0);
          break;
        default:
          particleSystem.color1 = new Color4(1, 1, 1, 1); // White
          particleSystem.color2 = new Color4(1, 1, 1, 0.5);
          particleSystem.colorDead = new Color4(0, 0, 0, 0);
          particleSystem.gravity = new Vector3(0, -9.81, 0);
      }
    } else {
      particleSystem.color1 = new Color4(1, 1, 1, 1);
      particleSystem.color2 = new Color4(1, 1, 1, 0.5);
      particleSystem.colorDead = new Color4(0, 0, 0, 0);
      particleSystem.gravity = new Vector3(0, -9.81, 0);
    }
    
    // Create a proper particle texture
    const texture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", instance.scene);
    particleSystem.particleTexture = texture;
    
    // Ensure particle system is properly configured for rendering
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.isBillboardBased = true;
    
    // Set emit box for proper particle distribution
    particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
    particleSystem.maxEmitBox = new Vector3(0.5, 0, 0.5);
    
    // Store the particle system
    instance.particleSystems.set(name, particleSystem);
    
    console.log(`Fallback particle system ${name} created with emitRate: ${particleSystem.emitRate}`);
    return particleSystem;
  }

  public static async createSound(name: string): Promise<Sound | null> {
    const instance = EffectsManager.getInstance();
    if (!instance.scene) {
      console.error("Scene not set in EffectsManager");
      return null;
    }

    try {
      console.log(`Creating sound: ${name}`);
      
      // Get sound configuration from THE WORD OF THE LORD
      const soundConfig = CONFIG.EFFECTS.SOUND_EFFECTS.find(sound => sound.name === name);
      if (!soundConfig) {
        console.error(`Sound configuration not found for: ${name}`);
        return null;
      }
      
      // Create sound with proper configuration from THE WORD OF THE LORD
      console.log(`Creating sound with URL: ${soundConfig.url}, loop: ${soundConfig.loop}, volume: ${soundConfig.volume}`);
      const sound = new Sound(name, soundConfig.url, instance.scene, null, {
        loop: soundConfig.loop,
        autoplay: false,
        volume: soundConfig.volume
      });
      
      // Store the sound
      instance.sounds.set(name, sound);
      
      console.log(`Sound ${name} created successfully with URL: ${soundConfig.url}`);
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
      EffectsManager.instance.particleSystems.forEach(ps => { ps.dispose(); });
      EffectsManager.instance.particleSystems.clear();
      
      // Dispose all sounds
      EffectsManager.instance.sounds.forEach(sound => { sound.dispose(); });
      EffectsManager.instance.sounds.clear();
      
      EffectsManager.instance.scene = null;
      EffectsManager.instance = undefined;
    }
  }

}
