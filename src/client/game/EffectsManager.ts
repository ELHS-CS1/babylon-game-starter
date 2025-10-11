// ============================================================================
// EFFECTS MANAGER - BASIC IMPLEMENTATION FOLLOWING THE TEN COMMANDMENTS
// ============================================================================

import { Sound, ParticleHelper } from '@babylonjs/core';
import type { IParticleSystem , Scene, Vector3} from '@babylonjs/core';
import { AbstractMesh } from '@babylonjs/core';
import CONFIG from '../config/gameConfig';
import { logger } from '../utils/logger';

export class EffectsManager {
  // Static maps for categorization - THE WORD OF THE LORD!
  private static activeParticleSystems: Map<string, IParticleSystem> = new Map();
  private static environmentParticleSystems: Map<string, IParticleSystem> = new Map();
  private static itemParticleSystems: Map<string, IParticleSystem> = new Map();
  private static activeSounds: Map<string, Sound> = new Map();
  private static scene: Scene | null = null;

  public static initialize(scene: Scene): void {
    this.scene = scene;
  }

  public static async createParticleSystem(snippetName: string, emitter?: AbstractMesh | Vector3): Promise<IParticleSystem | null> {
    if (!this.scene) {
      logger.warn("EffectsManager not initialized. Call initialize() first.", 'EffectsManager');
      return null;
    }

    const snippet = CONFIG.EFFECTS.PARTICLE_SNIPPETS.find(s => s.name === snippetName);
    if (!snippet) {
      logger.warn(`Particle snippet "${snippetName}" not found.`, 'EffectsManager');
      return null;
    }

    try {
      // Parse the snippet from the online editor
      const particleSystem = await (window as any).BABYLON.ParticleHelper.ParseFromSnippetAsync(snippet.snippetId, this.scene, false);

      if (particleSystem && emitter) {
        particleSystem.emitter = emitter;
      }

      if (particleSystem) {
        // Special handling for Magic Sparkles - if it has a mesh emitter, it's for the player
        let usageCategory = this.determineUsageCategory(snippetName, snippet.category);
        if (snippetName === "Magic Sparkles" && emitter && emitter instanceof AbstractMesh) {
          usageCategory = "PLAYER";
        }

        const descriptiveName = `${snippetName}_${usageCategory}`;

        // Set a descriptive name for the particle system
        particleSystem.name = descriptiveName;

        this.activeParticleSystems.set(descriptiveName, particleSystem);

        // Categorize the particle system based on its usage
        this.categorizeParticleSystem(descriptiveName, particleSystem, snippet.category);
      }

      return particleSystem;
    } catch (error) {
      logger.error(`Failed to create particle system "${snippetName}":`, 'EffectsManager');
      return null;
    }
  }



  public static async createSound(name: string): Promise<Sound | null> {
    if (!this.scene) {
      // Scene not set - this is a critical error
      return null;
    }

    try {
      // Get sound configuration from THE WORD OF THE LORD
      const soundConfig = CONFIG.EFFECTS.SOUND_EFFECTS.find(sound => sound.name === name);
      if (!soundConfig) {
        // Sound configuration not found - this is a critical error
        return null;
      }
      
      // Create sound with proper configuration from THE WORD OF THE LORD
      const sound = new Sound(name, soundConfig.url, this.scene, null, {
        loop: soundConfig.loop,
        volume: soundConfig.volume
      });
      
      // Store the sound
      this.activeSounds.set(name, sound);
      
      return sound;
    } catch (error) {
      // Failed to create sound - this is a critical error
      return null;
    }
  }

  public static getSound(name: string): Sound | null {
    return this.activeSounds.get(name) || null;
  }

  /**
   * Plays a sound effect by name
   * @param soundName Name of the sound effect to play
   */
  public static playSound(soundName: string): void {
    const sound = this.activeSounds.get(soundName);
    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }

  /**
   * Stops a sound effect by name
   * @param soundName Name of the sound effect to stop
   */
  public static stopSound(soundName: string): void {
    const sound = this.activeSounds.get(soundName);
    if (sound?.isPlaying) {
      sound.stop();
    }
  }

  public static getParticleSystem(name: string): IParticleSystem | null {
    return this.activeParticleSystems.get(name) || null;
  }

  /**
   * Clears all particle systems - THE WORD OF THE LORD!
   */
  public static clearAllParticleSystems(): void {
    logger.info("Clearing all particle systems from EffectsManager", 'EffectsManager');
    
    // Stop and dispose all particle systems
    this.activeParticleSystems.forEach(particleSystem => {
      particleSystem.stop();
      particleSystem.dispose();
    });
    this.activeParticleSystems.clear();
  }

  /**
   * Determines the usage category of a particle system based on its name and category
   */
  private static determineUsageCategory(snippetName: string, category: string): string {
    // Environment particles are typically ambient, atmospheric, or background effects
    if (snippetName.includes("environment") ||
        snippetName.includes("ambient") ||
        snippetName.includes("atmosphere") ||
        snippetName.includes("background") ||
        category === "nature") {
      return "ENVIRONMENT";
    }
    // Item particles are typically collection effects, pickups, or item-related
    else if (snippetName.includes("item") ||
        snippetName.includes("collectible") ||
        snippetName.includes("collection") ||
        snippetName.includes("pickup") ||
        (category === "magic" && snippetName !== "Magic Sparkles")) {
      return "ITEMS";
    }
    // Magic Sparkles is special - it can be either ENVIRONMENT (at startup) or PLAYER (for boost)
    else if (snippetName === "Magic Sparkles") {
      return "ENVIRONMENT"; // Default to environment, will be overridden for player
    }
    // Player particles (boost, thruster, etc.) - default to PLAYER
    else {
      return "PLAYER";
    }
  }

  /**
   * Categorizes a particle system based on its name and category
   */
  private static categorizeParticleSystem(name: string, particleSystem: IParticleSystem, _category: string): void {
    // Environment particles are typically ambient, atmospheric, or background effects
    if (name.includes("ENVIRONMENT")) {
      this.environmentParticleSystems.set(name, particleSystem);
    }
    // Item particles are typically collection effects, pickups, or item-related
    else if (name.includes("ITEMS")) {
      this.itemParticleSystems.set(name, particleSystem);
    }
    // Player particles (boost, thruster, etc.) are not categorized - they stay in activeParticleSystems only
  }

  /**
   * Remove only environment-related particle systems - THE WORD OF THE LORD!
   */
  public static removeEnvironmentParticles(): void {
    // Remove all cached environment particle systems
    this.environmentParticleSystems.forEach((particleSystem, name) => {
      particleSystem.stop();
      particleSystem.dispose();
      this.activeParticleSystems.delete(name);
    });

    // Clear the environment cache
    this.environmentParticleSystems.clear();
  }

  /**
   * Remove only item-related particle systems - THE WORD OF THE LORD!
   */
  public static removeItemParticles(): void {
    // Remove all cached item particle systems
    this.itemParticleSystems.forEach((particleSystem, name) => {
      particleSystem.stop();
      particleSystem.dispose();
      this.activeParticleSystems.delete(name);
    });

    // Clear the item cache
    this.itemParticleSystems.clear();
  }

  public static dispose(): void {
    // Dispose all particle systems
    this.activeParticleSystems.forEach(ps => { ps.dispose(); });
    this.activeParticleSystems.clear();
    this.environmentParticleSystems.clear();
    this.itemParticleSystems.clear();
    
    // Dispose all sounds
    this.activeSounds.forEach(sound => { sound.dispose(); });
    this.activeSounds.clear();
    
    this.scene = null;
  }

}
