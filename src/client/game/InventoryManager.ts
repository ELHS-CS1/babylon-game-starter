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
  // private static scene: Scene | null = null; // Unused for now
  private static characterController: CharacterController | null = null;
  private static inventoryItems: Map<string, InventoryItem> = new Map();
  private static originalJumpHeight: number = 0;
  // private static originalVisibility: number = 1; // Unused for now
  private static activeEffects: Set<string> = new Set();

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

      // Revert after 20 seconds
      setTimeout(() => {
        const currentCharacter = characterController.getCurrentCharacter();
        if (currentCharacter) {
          (currentCharacter as { jumpHeight: number }).jumpHeight = InventoryManager.originalJumpHeight;
          // Update character physics to revert the jump height
          characterController.updateCharacterPhysics(currentCharacter, characterController.getPosition());
        }
        InventoryManager.activeEffects.delete('superJump');
      }, 20000);
    },
    invisibility: (characterController: CharacterController) => {
      if (InventoryManager.activeEffects.has('invisibility')) {
        return; // Effect already active
      }
      // Store original visibility - commented out as property is unused
      // InventoryManager.originalVisibility = characterController.getPlayerMesh()?.visibility || 1;

      const playerMesh = characterController.getPlayerMesh();
      if (playerMesh !== null && playerMesh !== undefined) {
        characterController.getPlayerMesh().getChildMeshes()
          .forEach(m => {
            if (m.material) {
              m.material.alpha = 0.25;
            }
          });
      }

      InventoryManager.activeEffects.add('invisibility');

      // Revert after 20 seconds
      setTimeout(() => {
        const playerMesh = characterController.getPlayerMesh();
        if (playerMesh !== null && playerMesh !== undefined) {
          characterController.getPlayerMesh().getChildMeshes()
            .forEach(m => {
              if (m.material) {
                m.material.alpha = 1;
              }
            });
        }
        InventoryManager.activeEffects.delete('invisibility');
      }, 20000);
    }
  };

  /**
   * Initializes the InventoryManager
   * @param scene The Babylon.js scene
   * @param characterController The character controller
   */
  public static initialize(_scene: Scene, characterController: CharacterController): void {
    // this.scene = _scene; // Unused for now
    this.characterController = characterController;
    this.inventoryItems.clear();
    this.activeEffects.clear();
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
    logger.info(`Added inventory item: ${itemName}, count: ${existingItem ? existingItem.count : 1}`, 'InventoryManager');
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
    logger.info(`Used inventory item: ${itemName}, remaining count: ${item.count}`, 'InventoryManager');

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

    // Update inventory UI
    // Note: InventoryUI integration will be handled by the Vue component
    logger.info("Cleared all inventory items", 'InventoryManager');
  }

  /**
   * Uses an inventory item - THE WORD OF GOD!
   * @param itemName The name of the item to use
   */
  public static useItem(itemName: string): void {
    if (!this.characterController) {
      logger.warn("Character controller not available for item usage", 'InventoryManager');
      return;
    }

    const item = this.inventoryItems.get(itemName);
    if (!item || item.count <= 0) {
      logger.warn(`Cannot use item ${itemName}: not available or count is 0`, 'InventoryManager');
      return;
    }

    // Apply the item effect
    if (item.itemEffectKind !== null && item.itemEffectKind !== undefined && this.itemEffects[item.itemEffectKind] !== null && this.itemEffects[item.itemEffectKind] !== undefined) {
      this.itemEffects[item.itemEffectKind](this.characterController);
      
      // Decrease item count
      item.count--;
      
      // Remove item from inventory if count reaches 0
      if (item.count <= 0) {
        this.inventoryItems.delete(itemName);
      }
      
      logger.info(`Used item: ${itemName}, remaining count: ${item.count}`, 'InventoryManager');
    } else {
      logger.warn(`No effect defined for item: ${itemName}`, 'InventoryManager');
    }
  }

  /**
   * Disposes the InventoryManager
   */
  public static dispose(): void {
    // this.scene = null; // Unused for now
    this.characterController = null;
    this.inventoryItems.clear();
    this.activeEffects.clear();
  }
}
