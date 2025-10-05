// ============================================================================
// INVENTORY MANAGER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { Scene } from '@babylonjs/core';
import type { CharacterController } from './CharacterController';
import { logger } from '../utils/logger';

// Inventory System Type Definitions - IDENTICAL TO PLAYGROUND.TS
export type ItemEffectKind = "superJump" | "invisibility";

export type ItemEffect = {
  readonly [_K in ItemEffectKind]: (_characterController: CharacterController) => void;
};

export interface InventoryItem {
  count: number;
  itemEffectKind: ItemEffectKind;
  thumbnail: string;
}

export class InventoryManager {
  private static scene: Scene | null = null;
  private static characterController: CharacterController | null = null;
  private static inventoryItems: Map<string, InventoryItem> = new Map();
  private static originalJumpHeight: number = 0;
  private static originalVisibility: number = 1;
  private static activeEffects: Set<string> = new Set();
  private static effectExpiryTimes: Map<string, number> = new Map();
  private static effectDurations: Map<string, number> = new Map();

  // Item effects implementation - IDENTICAL TO PLAYGROUND.TS
  private static readonly itemEffects: ItemEffect = {
    superJump: (characterController: CharacterController) => {
      if (InventoryManager.activeEffects.has('superJump')) {
        return; // Effect already active
      }

      // Store original jump height
      const currentCharacter = characterController.getCurrentCharacter();
      InventoryManager.originalJumpHeight = currentCharacter?.jumpHeight ?? 2.0;

      // Triple the jump height
      const newJumpHeight = InventoryManager.originalJumpHeight * 3;
      if (currentCharacter) {
        (currentCharacter as { jumpHeight: number }).jumpHeight = newJumpHeight;
        // Update character physics to apply the new jump height
        characterController.updateCharacterPhysics(currentCharacter, characterController.getPosition());
      }

      InventoryManager.activeEffects.add('superJump');

      // Set expiry time for the effect
      const duration = InventoryManager.effectDurations.get('superJump') || 10000;
      const expiryTime = Date.now() + duration;
      InventoryManager.effectExpiryTimes.set('superJump', expiryTime);

      // Log inventory item effects with assertions
      logger.info(`Super jump effect activated for character, expires in ${duration}ms`, { context: 'InventoryManager', tag: 'inventory' });
      logger.assert(
        InventoryManager.activeEffects.has('superJump'),
        `Super jump effect should be active`,
        `Super jump effect was not properly activated`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
      logger.assert(
        newJumpHeight > InventoryManager.originalJumpHeight,
        `New jump height ${newJumpHeight} should be greater than original ${InventoryManager.originalJumpHeight}`,
        `Jump height was not properly increased`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
    },
    invisibility: (characterController: CharacterController) => {
      if (InventoryManager.activeEffects.has('invisibility')) {
        return; // Effect already active
      }

      // Store original visibility
      InventoryManager.originalVisibility = characterController.getPlayerMesh()?.visibility || 1;

      if (characterController.getPlayerMesh()) {
        const childMeshes = characterController.getPlayerMesh().getChildMeshes();
        logger.info(`Found ${childMeshes.length} child meshes for invisibility effect`, { context: 'InventoryManager', tag: 'inventory' });
        childMeshes.forEach((m, index) => {
          if (m.material) {
            logger.info(`Setting alpha to 0.25 for mesh ${index}: ${m.name}`, { context: 'InventoryManager', tag: 'inventory' });
            m.material.alpha = 0.25;
          } else {
            logger.warn(`Mesh ${index} has no material: ${m.name}`, { context: 'InventoryManager', tag: 'inventory' });
          }
        });
      } else {
        logger.warn(`No player mesh found for invisibility effect`, { context: 'InventoryManager', tag: 'inventory' });
      }

      InventoryManager.activeEffects.add('invisibility');

      // Set expiry time for the effect
      const duration = InventoryManager.effectDurations.get('invisibility') || 15000;
      const expiryTime = Date.now() + duration;
      InventoryManager.effectExpiryTimes.set('invisibility', expiryTime);

      // Log inventory item effects with assertions
      logger.info(`Invisibility effect activated for character, expires in ${duration}ms`, { context: 'InventoryManager', tag: 'inventory' });
      logger.assert(
        InventoryManager.activeEffects.has('invisibility'),
        `Invisibility effect should be active`,
        `Invisibility effect was not properly activated`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
      logger.assert(
        characterController.getPlayerMesh() !== null && characterController.getPlayerMesh() !== undefined,
        `Player mesh should be available for invisibility effect`,
        `Player mesh was not available for invisibility effect`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
    }
  };

  /**
   * Initializes the InventoryManager
   * @param scene The Babylon.js scene
   * @param characterController The character controller
   */
  public static initialize(scene: Scene, characterController: CharacterController): void {
    this.scene = scene;
    this.characterController = characterController;
    this.inventoryItems.clear();
    this.activeEffects.clear();
    this.effectExpiryTimes.clear();
    
    // Initialize effect durations (in milliseconds)
    this.effectDurations.set('superJump', 10000); // 10 seconds
    this.effectDurations.set('invisibility', 15000); // 15 seconds
    
    // Set up the update loop using onBeforeRenderObservable
    this.setupUpdateLoop();
    
    logger.info("InventoryManager initialized with character controller and update loop", { context: 'InventoryManager', tag: 'inventory' });
  }

  /**
   * Sets up the update loop using onBeforeRenderObservable
   */
  private static setupUpdateLoop(): void {
    if (!this.scene) {
      logger.warn("Scene not available for update loop setup", { context: 'InventoryManager', tag: 'inventory' });
      return;
    }

    this.scene.onBeforeRenderObservable.add(() => {
      this.updateEffects();
    });

    logger.info("Update loop setup complete", { context: 'InventoryManager', tag: 'inventory' });
  }

  /**
   * Updates all active effects, checking for expiry and reverting expired effects
   */
  private static updateEffects(): void {
    const currentTime = Date.now();
    const expiredEffects: string[] = [];

    // Check each active effect for expiry
    for (const [effectName, expiryTime] of this.effectExpiryTimes) {
      if (currentTime >= expiryTime) {
        expiredEffects.push(effectName);
      }
    }

    // Revert expired effects
    for (const effectName of expiredEffects) {
      this.revertEffect(effectName);
    }
  }

  /**
   * Reverts a specific effect to its original state
   * @param effectName The name of the effect to revert
   */
  private static revertEffect(effectName: string): void {
    if (!this.characterController) {
      logger.warn("Character controller not available for effect reversion", { context: 'InventoryManager', tag: 'inventory' });
      return;
    }

    switch (effectName) {
      case 'superJump':
        this.revertSuperJump();
        break;
      case 'invisibility':
        this.revertInvisibility();
        break;
      default:
        logger.warn(`Unknown effect to revert: ${effectName}`, { context: 'InventoryManager', tag: 'inventory' });
        return;
    }

    // Clean up effect tracking
    this.activeEffects.delete(effectName);
    this.effectExpiryTimes.delete(effectName);

    logger.info(`Effect ${effectName} reverted and cleaned up`, { context: 'InventoryManager', tag: 'inventory' });
  }

  /**
   * Reverts the super jump effect to original jump height
   */
  private static revertSuperJump(): void {
    if (!this.characterController) return;

    const currentCharacter = this.characterController.getCurrentCharacter();
    if (currentCharacter) {
      (currentCharacter as { jumpHeight: number }).jumpHeight = this.originalJumpHeight;
      this.characterController.updateCharacterPhysics(currentCharacter, this.characterController.getPosition());
      logger.info(`Super jump effect reverted to original height: ${this.originalJumpHeight}`, { context: 'InventoryManager', tag: 'inventory' });
    }
  }

  /**
   * Reverts the invisibility effect to original visibility
   */
  private static revertInvisibility(): void {
    if (!this.characterController) return;

    const playerMesh = this.characterController.getPlayerMesh();
    if (playerMesh) {
      const childMeshes = playerMesh.getChildMeshes();
      childMeshes.forEach((mesh, index) => {
        if (mesh.material) {
          mesh.material.alpha = this.originalVisibility;
          logger.info(`Reverted alpha to ${this.originalVisibility} for mesh ${index}: ${mesh.name}`, { context: 'InventoryManager', tag: 'inventory' });
        }
      });
      logger.info(`Invisibility effect reverted to original visibility: ${this.originalVisibility}`, { context: 'InventoryManager', tag: 'inventory' });
    }
  }

  /**
   * Adds an inventory item when collected
   * @param itemName The name of the item
   * @param itemEffectKind The effect kind of the item
   * @param thumbnail The thumbnail URL
   */
  public static addInventoryItem(itemName: string, itemEffectKind: ItemEffectKind, thumbnail: string): void {
    const existingItem = this.inventoryItems.get(itemName);

    if (existingItem) {
      // Increment count if item already exists
      existingItem.count++;
    } else {
      // Create new item entry
      this.inventoryItems.set(itemName, {
        count: 1,
        itemEffectKind,
        thumbnail
      });
    }

    // Update inventory UI if it's open
    // Note: InventoryUI integration will be handled by the Vue component
    logger.info(`Added inventory item: ${itemName}, count: ${existingItem ? existingItem.count : 1}`, { context: 'InventoryManager', tag: 'inventory' });
    logger.info(`Total inventory items: ${this.inventoryItems.size}`, { context: 'InventoryManager', tag: 'inventory' });
  }

  /**
   * Uses an inventory item
   * @param itemName The name of the item to use
   * @returns True if item was used successfully, false if not available
   */
  public static useInventoryItem(itemName: string): boolean {
    const item = this.inventoryItems.get(itemName);

    if (!item || item.count <= 0) {
      return false;
    }

    // Decrement count
    item.count--;

    // If count reaches 0, remove the item
    if (item.count <= 0) {
      this.inventoryItems.delete(itemName);
    }

    // Apply the item effect
    const effectFunction = this.itemEffects[item.itemEffectKind];
    if (effectFunction !== null && effectFunction !== undefined && this.characterController !== null && this.characterController !== undefined) {
      effectFunction(this.characterController);
    }

    // Update inventory UI
    // Note: InventoryUI integration will be handled by the Vue component
    logger.info(`Used inventory item: ${itemName}, remaining count: ${item.count}`, { context: 'InventoryManager', tag: 'inventory' });

    return true;
  }

  /**
   * Gets all inventory items
   * @returns Map of item names to item data
   */
  public static getInventoryItems(): Map<string, InventoryItem> {
    return new Map(this.inventoryItems);
  }

  /**
   * Gets the count of a specific item
   * @param itemName The name of the item
   * @returns The count of the item, 0 if not found
   */
  public static getItemCount(itemName: string): number {
    const item = this.inventoryItems.get(itemName);
    return item ? item.count : 0;
  }

  /**
   * Clears all inventory items
   */
  public static clearInventory(): void {
    this.inventoryItems.clear();
    this.activeEffects.clear();
    this.effectExpiryTimes.clear();

    // Update inventory UI
    // Note: InventoryUI integration will be handled by the Vue component
    logger.info("Cleared all inventory items and active effects", { context: 'InventoryManager', tag: 'inventory' });
  }

  /**
   * Uses an inventory item - THE WORD OF GOD!
   * @param itemName The name of the item to use
   */
  public static useItem(itemName: string): void {
    logger.info(`useItem called for: ${itemName}`, { context: 'InventoryManager', tag: 'inventory' });
    if (!this.characterController) {
      logger.warn("Character controller not available for item usage", { context: 'InventoryManager', tag: 'inventory' });
      return;
    }

    const item = this.inventoryItems.get(itemName);
    logger.info(`Item found: ${!!item}, count: ${item?.count || 0}`, { context: 'InventoryManager', tag: 'inventory' });
    if (!item || item.count <= 0) {
      logger.warn(`Cannot use item ${itemName}: not available or count is 0`, { context: 'InventoryManager', tag: 'inventory' });
      return;
    }

    // Apply the item effect
    logger.info(`Item effect kind: ${item.itemEffectKind}`, { context: 'InventoryManager', tag: 'inventory' });
    logger.info(`Effect function exists: ${!!this.itemEffects[item.itemEffectKind]}`, { context: 'InventoryManager', tag: 'inventory' });
    if (item.itemEffectKind !== null && item.itemEffectKind !== undefined && this.itemEffects[item.itemEffectKind] !== null && this.itemEffects[item.itemEffectKind] !== undefined) {
      logger.info(`Applying item effect: ${item.itemEffectKind}`, { context: 'InventoryManager', tag: 'inventory' });
      this.itemEffects[item.itemEffectKind](this.characterController);
      
      // Decrease item count
      item.count--;
      
      // Remove item from inventory if count reaches 0
      if (item.count <= 0) {
        this.inventoryItems.delete(itemName);
      }
      
      logger.info(`Used item: ${itemName}, remaining count: ${item.count}`, { context: 'InventoryManager', tag: 'inventory' });
      
      // Log inventory item effects with assertions
      logger.info(`Inventory item effect applied for: ${itemName}`, { context: 'InventoryManager', tag: 'inventory' });
      logger.assert(
        item.count >= 0,
        `Item count should be non-negative`,
        `Item count ${item.count} is negative for ${itemName}`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
      logger.assert(
        this.characterController !== null,
        `Character controller should be available for item effects`,
        `Character controller was not available for item effects`,
        { context: 'InventoryManager', tag: 'inventory' }
      );
    } else {
      logger.warn(`No effect defined for item: ${itemName}`, { context: 'InventoryManager', tag: 'inventory' });
    }
  }

  /**
   * Disposes the InventoryManager
   */
  public static dispose(): void {
    this.scene = null;
    this.characterController = null;
    this.inventoryItems.clear();
    this.activeEffects.clear();
    this.effectExpiryTimes.clear();
    this.effectDurations.clear();
  }
}
