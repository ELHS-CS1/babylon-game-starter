// ============================================================================
// ASSET CACHE MANAGER - THE SACRED LOCAL-FIRST CACHING SYSTEM
// ============================================================================

import type { Scene } from '@babylonjs/core';
import { ImportMeshAsync, ParticleHelper, Sound } from '@babylonjs/core';
import { logger } from '../utils/logger';

export interface CachedAsset {
  data: unknown;
  timestamp: number;
  version: string;
  isLocal: boolean;
}

export interface CachedModel {
  meshes: unknown[];
  particleSystems: unknown[];
  sounds: unknown[];
  metadata: {
    name: string;
    url: string;
    size: number;
    lastModified: number;
  };
}

export interface CachedParticleSnippet {
  name: string;
  snippetId: string;
  particleSystem: unknown;
  metadata: {
    category: string;
    description: string;
    lastUsed: number;
  };
}

export class AssetCacheManager {
  private static instance: AssetCacheManager | undefined;
  // private cache: Map<string, CachedAsset> = new Map(); // Unused for now
  private modelCache: Map<string, CachedModel> = new Map();
  private particleCache: Map<string, CachedParticleSnippet> = new Map();
  private soundCache: Map<string, unknown> = new Map();
  private scene: Scene | null = null;
  private isOnline: boolean = true;
  private cacheVersion: string = '1.0.0';

  private constructor() {
    this.setupNetworkDetection();
  }

  public static getInstance(): AssetCacheManager {
    AssetCacheManager.instance ??= new AssetCacheManager();
    return AssetCacheManager.instance;
  }

  public initialize(scene: Scene): void {
    this.scene = scene;
    this.loadCacheFromStorage();
    logger.info('AssetCacheManager initialized', 'AssetCacheManager');
  }

  private setupNetworkDetection(): void {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Network connection restored', 'AssetCacheManager');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('Network connection lost - using cached assets', 'AssetCacheManager');
    });

    // Check initial network status
    this.isOnline = navigator.onLine;
  }

  /**
   * Loads a model with local-first caching strategy
   * @param url The remote URL of the model
   * @param name The name/identifier for the model
   * @returns Promise<CachedModel | null>
   */
  public async loadModel(url: string, name: string): Promise<CachedModel | null> {
    const cacheKey = `model_${name}`;
    
    // Check if we have a cached version
    const cached = this.modelCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.metadata.lastModified)) {
      logger.info(`Using cached model: ${name}`, 'AssetCacheManager');
      return cached;
    }

    // Try to load from remote if online
    if (this.isOnline) {
      try {
        logger.info(`Loading model from remote: ${url}`, 'AssetCacheManager');
        const result = await ImportMeshAsync(url, this.scene!);
        
        const cachedModel: CachedModel = {
          meshes: result.meshes,
          particleSystems: [],
          sounds: [],
          metadata: {
            name,
            url,
            size: 0, // Would need to calculate from actual data
            lastModified: Date.now()
          }
        };

        // Cache the model
        this.modelCache.set(cacheKey, cachedModel);
        this.saveCacheToStorage();
        
        return cachedModel;
      } catch (error) {
        logger.error(`Failed to load model from remote: ${url}`, 'AssetCacheManager');
        // Fall back to cached version if available
        if (cached) {
          logger.warn(`Using stale cached model: ${name}`, 'AssetCacheManager');
          return cached;
        }
      }
    }

    // If offline or remote load failed, use cached version
    if (cached) {
      logger.warn(`Using cached model (offline): ${name}`, 'AssetCacheManager');
      return cached;
    }

    logger.error(`No cached model available for: ${name}`, 'AssetCacheManager');
    return null;
  }

  /**
   * Loads a particle system with local-first caching strategy
   * @param snippetId The Babylon.js Playground snippet ID
   * @param name The name of the particle system
   * @returns Promise<CachedParticleSnippet | null>
   */
  public async loadParticleSnippet(snippetId: string, name: string): Promise<CachedParticleSnippet | null> {
    const cacheKey = `particle_${name}`;
    
    // Check if we have a cached version
    const cached = this.particleCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.metadata.lastUsed)) {
      logger.info(`Using cached particle system: ${name}`, 'AssetCacheManager');
      return cached;
    }

    // Try to load from remote if online
    if (this.isOnline) {
      try {
        logger.info(`Loading particle system from snippet: ${snippetId}`, 'AssetCacheManager');
        if (this.scene === null) {
          throw new Error('Scene not initialized');
        }
        const particleSystem = await ParticleHelper.ParseFromSnippetAsync(snippetId, this.scene, false);
        
        if (particleSystem) {
          const cachedParticle: CachedParticleSnippet = {
            name,
            snippetId,
            particleSystem,
            metadata: {
              category: 'cached',
              description: `Cached particle system: ${name}`,
              lastUsed: Date.now()
            }
          };

          // Cache the particle system
          this.particleCache.set(cacheKey, cachedParticle);
          this.saveCacheToStorage();
          
          return cachedParticle;
        }
      } catch (error) {
        logger.error(`Failed to load particle system from snippet: ${snippetId}`, 'AssetCacheManager');
        // Fall back to cached version if available
        if (cached) {
          logger.warn(`Using stale cached particle system: ${name}`, 'AssetCacheManager');
          return cached;
        }
      }
    }

    // If offline or remote load failed, use cached version
    if (cached) {
      logger.warn(`Using cached particle system (offline): ${name}`, 'AssetCacheManager');
      return cached;
    }

    logger.error(`No cached particle system available for: ${name}`, 'AssetCacheManager');
    return null;
  }

  /**
   * Preloads and caches all essential assets for offline play
   * @param assets Array of asset URLs to preload
   */
  public async preloadAssets(assets: Array<{url: string, name: string, type: 'model' | 'particle' | 'sound'}>): Promise<void> {
    logger.info(`Preloading ${assets.length} assets for offline play`, 'AssetCacheManager');
    
    const preloadPromises = assets.map(async (asset) => {
      try {
        switch (asset.type) {
          case 'model':
            await this.loadModel(asset.url, asset.name);
            break;
          case 'particle':
            await this.loadParticleSnippet(asset.url, asset.name);
            break;
          case 'sound':
            await this.loadSound(asset.url, asset.name);
            break;
        }
      } catch (error) {
        logger.error(`Failed to preload asset: ${asset.name}`, 'AssetCacheManager');
      }
    });

    await Promise.allSettled(preloadPromises);
    logger.info('Asset preloading completed', 'AssetCacheManager');
  }

  /**
   * Loads a sound with local-first caching strategy
   * @param url The remote URL of the sound
   * @param name The name/identifier for the sound
   * @returns Promise<any | null>
   */
  public async loadSound(url: string, name: string): Promise<unknown | null> {
    const cacheKey = `sound_${name}`;
    
    // Check if we have a cached version
    const cached = this.soundCache.get(cacheKey);
    if (cached && this.isCacheValid((cached as { timestamp: number }).timestamp)) {
      logger.info(`Using cached sound: ${name}`, 'AssetCacheManager');
      return cached;
    }

    // Try to load from remote if online
    if (this.isOnline) {
      try {
        logger.info(`Loading sound from remote: ${url}`, 'AssetCacheManager');
        const sound = new Sound(name, url, this.scene!, null, { volume: 0.7 });
        
        const cachedSound = {
          sound,
          timestamp: Date.now(),
          url,
          name
        };

        // Cache the sound
        this.soundCache.set(cacheKey, cachedSound);
        this.saveCacheToStorage();
        
        return cachedSound;
      } catch (error) {
        logger.error(`Failed to load sound from remote: ${url}`, 'AssetCacheManager');
        // Fall back to cached version if available
        if (cached) {
          logger.warn(`Using stale cached sound: ${name}`, 'AssetCacheManager');
          return cached;
        }
      }
    }

    // If offline or remote load failed, use cached version
    if (cached) {
      logger.warn(`Using cached sound (offline): ${name}`, 'AssetCacheManager');
      return cached;
    }

    logger.error(`No cached sound available for: ${name}`, 'AssetCacheManager');
    return null;
  }

  /**
   * Checks if cached data is still valid
   * @param timestamp The timestamp to check
   * @returns boolean
   */
  private isCacheValid(timestamp: number): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return (Date.now() - timestamp) < maxAge;
  }

  /**
   * Saves cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData = {
        version: this.cacheVersion,
        models: Array.from(this.modelCache.entries()),
        particles: Array.from(this.particleCache.entries()),
        sounds: Array.from(this.soundCache.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem('babylon_asset_cache', JSON.stringify(cacheData));
      logger.debug('Cache saved to localStorage', 'AssetCacheManager');
      } catch {
        logger.error('Failed to save cache to localStorage', 'AssetCacheManager');
      }
  }

  /**
   * Loads cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('babylon_asset_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        // Check version compatibility
        if (parsed.version === this.cacheVersion) {
          this.modelCache = new Map(parsed.models);
          this.particleCache = new Map(parsed.particles);
          this.soundCache = new Map(parsed.sounds);
          
          logger.info(`Loaded cache from localStorage (${this.modelCache.size} models, ${this.particleCache.size} particles, ${this.soundCache.size} sounds)`, 'AssetCacheManager');
        } else {
          logger.warn('Cache version mismatch - clearing cache', 'AssetCacheManager');
          this.clearCache();
        }
      }
    } catch (error) {
      logger.error('Failed to load cache from localStorage', 'AssetCacheManager');
      this.clearCache();
    }
  }

  /**
   * Clears all cached data
   */
  public clearCache(): void {
    this.modelCache.clear();
    this.particleCache.clear();
    this.soundCache.clear();
    localStorage.removeItem('babylon_asset_cache');
    logger.info('Cache cleared', 'AssetCacheManager');
  }

  /**
   * Gets cache statistics
   * @returns Object with cache statistics
   */
  public getCacheStats(): {
    models: number;
    particles: number;
    sounds: number;
    totalSize: number;
    isOnline: boolean;
  } {
    return {
      models: this.modelCache.size,
      particles: this.particleCache.size,
      sounds: this.soundCache.size,
      totalSize: this.modelCache.size + this.particleCache.size + this.soundCache.size,
      isOnline: this.isOnline
    };
  }
}
