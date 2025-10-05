// ============================================================================
// SKY MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { Scene, Mesh} from '@babylonjs/core';
import { Texture, StandardMaterial, Color3, MeshBuilder, Vector3 } from '@babylonjs/core';
import { logger } from '../utils/logger';

export interface SkyConfig {
  readonly TEXTURE_URL: string;
  readonly ROTATION_Y: number;
  readonly BLUR: number;
  readonly TYPE: "BOX" | "SPHERE";
}

export class SkyManager {
  private static sky: Mesh | null = null;
  private static skyTexture: Texture | null = null;

  /**
   * Creates and applies a sky to the scene - THE WORD OF THE LORD!
   * @param scene The Babylon.js scene
   * @param skyConfig Sky configuration
   * @returns The created sky mesh
   */
  public static createSky(scene: Scene, skyConfig: SkyConfig): Mesh {
    logger.info("Creating sky", 'SkyManager');
    
    // Remove existing sky if present - THE WORD OF THE LORD!
    this.removeSky(scene);

    // Create sky texture - THE WORD OF THE LORD!
    this.skyTexture = new Texture(skyConfig.TEXTURE_URL, scene);
    logger.info(`Created sky texture: ${skyConfig.TEXTURE_URL}`, 'SkyManager');

    // Apply blur if configured - THE WORD OF THE LORD!
    if (skyConfig.BLUR > 0) {
      this.skyTexture.level = skyConfig.BLUR;
      logger.info(`Applied sky blur: ${skyConfig.BLUR}`, 'SkyManager');
    }

    // Create sky based on type - THE WORD OF THE LORD!
    if (skyConfig.TYPE.toUpperCase() === "SPHERE") {
      this.createSkySphere(scene, skyConfig.ROTATION_Y);
    } else {
      this.createSkyBox(scene, skyConfig.ROTATION_Y);
    }

    logger.info("Sky created successfully", 'SkyManager');
    return this.sky!;
  }

  /**
   * Creates a sky sphere (360-degree sphere) - THE WORD OF THE LORD!
   */
  private static createSkySphere(scene: Scene, rotationY: number): void {
    logger.info("Creating sky sphere", 'SkyManager');
    
    this.sky = MeshBuilder.CreateSphere("skySphere", {
      diameter: 1000.0,
      segments: 32
    }, scene);

    // Create sky material for sphere - THE WORD OF THE LORD!
    const skyMaterial = new StandardMaterial("skySphere", scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.diffuseTexture = this.skyTexture;
    skyMaterial.disableLighting = true;
    skyMaterial.emissiveTexture = this.skyTexture;
    skyMaterial.emissiveColor = new Color3(1, 1, 1);

    // Apply material to sky - THE WORD OF THE LORD!
    this.sky.material = skyMaterial;

    // Position and rotate sky - THE WORD OF THE LORD!
    this.sky.position = new Vector3(0, 0, 0);
    this.sky.rotation.x = Math.PI;

    if (rotationY !== 0) {
      this.sky.rotation.y = rotationY;
      logger.info(`Applied sky rotation Y: ${rotationY}`, 'SkyManager');
    }
  }

  /**
   * Creates a sky box (standard cube skybox) - THE WORD OF THE LORD!
   */
  private static createSkyBox(scene: Scene, rotationY: number): void {
    logger.info("Creating sky box", 'SkyManager');
    
    // Set texture coordinates mode for cube skybox - THE WORD OF THE LORD!
    this.skyTexture!.coordinatesMode = Texture.SKYBOX_MODE;

    this.sky = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);

    // Create sky material for box - THE WORD OF THE LORD!
    const skyMaterial = new StandardMaterial("skyBox", scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.diffuseTexture = this.skyTexture;
    skyMaterial.disableLighting = true;
    skyMaterial.emissiveTexture = this.skyTexture;
    skyMaterial.emissiveColor = new Color3(1, 1, 1);

    // Apply material to sky - THE WORD OF THE LORD!
    this.sky.material = skyMaterial;

    if (rotationY !== 0) {
      this.sky.rotation.y = rotationY;
      logger.info(`Applied sky rotation Y: ${rotationY}`, 'SkyManager');
    }
  }

  /**
   * Removes the sky from the scene - THE WORD OF THE LORD!
   */
  public static removeSky(_scene: Scene): void {
    logger.info("Removing sky", 'SkyManager');
    
    if (this.sky) {
      this.sky.dispose();
      this.sky = null;
      logger.info("Sky mesh disposed", 'SkyManager');
    }

    if (this.skyTexture) {
      this.skyTexture.dispose();
      this.skyTexture = null;
      logger.info("Sky texture disposed", 'SkyManager');
    }
  }

  /**
   * Updates the sky rotation - THE WORD OF THE LORD!
   */
  public static updateSkyRotation(rotationY: number): void {
    if (this.sky) {
      this.sky.rotation.y = rotationY;
      logger.info(`Updated sky rotation Y: ${rotationY}`, 'SkyManager');
    }
  }

  /**
   * Updates the sky blur - THE WORD OF THE LORD!
   */
  public static updateSkyBlur(blur: number): void {
    if (this.skyTexture) {
      this.skyTexture.level = blur;
      logger.info(`Updated sky blur: ${blur}`, 'SkyManager');
    }
  }

  /**
   * Gets the current sky mesh - THE WORD OF THE LORD!
   * @returns The sky mesh or null if not created
   */
  public static getSky(): Mesh | null {
    return this.sky;
  }

  /**
   * Checks if a sky exists - THE WORD OF THE LORD!
   * @returns True if sky exists, false otherwise
   */
  public static hasSky(): boolean {
    return this.sky !== null;
  }
}
