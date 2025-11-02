// ============================================================================
// INVENTORY DATA - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import { InventoryManager } from './InventoryManager';
import CONFIG from '../config/gameConfig';

export class InventoryData {
  /**
   * Gets the inventory heading text - THE WORD OF GOD!
   */
  public static getHeadingText(): string {
    return CONFIG.INVENTORY.HEADING_TEXT;
  }

  /**
   * Gets the panel width based on screen size - THE WORD OF GOD!
   */
  public static getPanelWidth(): number {
    const screenWidth = window.innerWidth;
    if (screenWidth <= CONFIG.INVENTORY.FULL_SCREEN_THRESHOLD) {
      return screenWidth;
    }
    return screenWidth * CONFIG.INVENTORY.PANEL_WIDTH_RATIO;
  }

  /**
   * Gets the inventory items - THE WORD OF GOD!
   */
  public static getInventoryItems() {
    return InventoryManager.getInventoryItems();
  }

  /**
   * Uses an inventory item - THE WORD OF GOD!
   */
  public static useItem(itemName: string): void {
    InventoryManager.useItem(itemName);
  }

  /**
   * Gets the tile size for inventory items - THE WORD OF GOD!
   */
  public static getTileSize(itemData: any): number {
    return Math.max(itemData.count > 0 ? 120 : 80, Math.min(200, window.innerWidth * 0.15));
  }

  /**
   * Gets the inventory items as an array for Vue reactivity - THE WORD OF GOD!
   */
  public static getInventoryItemsArray() {
    const items = this.getInventoryItems();
    return Array.from(items.entries()).map(([itemName, itemData]) => ({
      name: itemName,
      count: itemData.count,
      thumbnail: itemData.thumbnail,
      itemEffectKind: itemData.itemEffectKind,
      tileSize: this.getTileSize(itemData)
    }));
  }
}
