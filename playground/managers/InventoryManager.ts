// ============================================================================
// INVENTORY MANAGER
// ============================================================================

import type { CharacterController } from '../controllers/CharacterController';

export interface InventoryItem {
    name: string;
    count: number;
    maxCount: number;
    effect?: string;
    thumbnail: string;
}

export class InventoryManager {
    private static scene: BABYLON.Scene | null = null;
    private static characterController: CharacterController | null = null;
    private static inventoryItems: Map<string, InventoryItem> = new Map();
    private static activeEffects: Map<string, number> = new Map();

    /**
     * Initializes the InventoryManager
     */
    public static initialize(scene: BABYLON.Scene, characterController: CharacterController): void {
        this.scene = scene;
        this.characterController = characterController;
        this.inventoryItems.clear();
        this.activeEffects.clear();
    }

    /**
     * Adds an item to the inventory
     */
    public static addItem(itemName: string, count: number = 1, thumbnail: string = ''): void {
        const existingItem = this.inventoryItems.get(itemName);
        if (existingItem) {
            existingItem.count = Math.min(existingItem.count + count, existingItem.maxCount);
        } else {
            this.inventoryItems.set(itemName, {
                name: itemName,
                count: count,
                maxCount: 10, // Default max count
                thumbnail: thumbnail
            });
        }
    }

    /**
     * Removes an item from the inventory
     */
    public static removeItem(itemName: string, count: number = 1): boolean {
        const item = this.inventoryItems.get(itemName);
        if (item && item.count >= count) {
            item.count -= count;
            if (item.count <= 0) {
                this.inventoryItems.delete(itemName);
            }
            return true;
        }
        return false;
    }

    /**
     * Uses an inventory item
     */
    public static useInventoryItem(_itemName: string): boolean {
        // This would implement item usage logic
        // For now, just return true to indicate success
        return true;
    }

    /**
     * Gets all inventory items
     */
    public static getInventoryItems(): Map<string, InventoryItem> {
        return new Map(this.inventoryItems);
    }

    /**
     * Gets the count of a specific item
     */
    public static getItemCount(itemName: string): number {
        const item = this.inventoryItems.get(itemName);
        return item ? item.count : 0;
    }

    /**
     * Checks if the player has a specific item
     */
    public static hasItem(itemName: string): boolean {
        return this.getItemCount(itemName) > 0;
    }

    /**
     * Disposes of the InventoryManager
     */
    public static dispose(): void {
        this.inventoryItems.clear();
        this.activeEffects.clear();
        this.scene = null;
        this.characterController = null;
    }
}
