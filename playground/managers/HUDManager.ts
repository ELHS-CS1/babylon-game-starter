// ============================================================================
// HUD MANAGER
// ============================================================================

import type { CharacterController } from '../controllers/CharacterController';

export class HUDManager {
    private static scene: BABYLON.Scene | null = null;
    private static characterController: CharacterController | null = null;
    private static hudContainer: HTMLElement | null = null;
    private static hudElements: Map<string, HTMLElement> = new Map();

    /**
     * Initializes the HUD with a scene and character controller
     */
    public static initialize(scene: BABYLON.Scene, characterController: CharacterController): void {
        this.scene = scene;
        this.characterController = characterController;
        this.createHUD();
    }

    /**
     * Creates the HUD elements
     */
    private static createHUD(): void {
        // Create HUD container
        this.hudContainer = document.createElement('div');
        this.hudContainer.id = 'game-hud';
        this.hudContainer.style.position = 'absolute';
        this.hudContainer.style.top = '0';
        this.hudContainer.style.left = '0';
        this.hudContainer.style.width = '100%';
        this.hudContainer.style.height = '100%';
        this.hudContainer.style.pointerEvents = 'none';
        this.hudContainer.style.zIndex = '1000';
        document.body.appendChild(this.hudContainer);

        // Create crosshair
        this.createCrosshair();
        
        // Create health bar
        this.createHealthBar();
        
        // Create inventory display
        this.createInventoryDisplay();
    }

    /**
     * Creates the crosshair element
     */
    private static createCrosshair(): void {
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.width = '20px';
        crosshair.style.height = '20px';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.border = '2px solid white';
        crosshair.style.borderRadius = '50%';
        crosshair.style.pointerEvents = 'none';
        this.hudContainer?.appendChild(crosshair);
        this.hudElements.set('crosshair', crosshair);
    }

    /**
     * Creates the health bar element
     */
    private static createHealthBar(): void {
        const healthBar = document.createElement('div');
        healthBar.id = 'health-bar';
        healthBar.style.position = 'absolute';
        healthBar.style.top = '20px';
        healthBar.style.left = '20px';
        healthBar.style.width = '200px';
        healthBar.style.height = '20px';
        healthBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        healthBar.style.border = '2px solid white';
        healthBar.style.borderRadius = '10px';
        this.hudContainer?.appendChild(healthBar);
        this.hudElements.set('health-bar', healthBar);
    }

    /**
     * Creates the inventory display element
     */
    private static createInventoryDisplay(): void {
        const inventory = document.createElement('div');
        inventory.id = 'inventory-display';
        inventory.style.position = 'absolute';
        inventory.style.bottom = '20px';
        inventory.style.left = '20px';
        inventory.style.width = '300px';
        inventory.style.height = '60px';
        inventory.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        inventory.style.border = '2px solid white';
        inventory.style.borderRadius = '10px';
        inventory.style.display = 'flex';
        inventory.style.alignItems = 'center';
        inventory.style.justifyContent = 'space-around';
        this.hudContainer?.appendChild(inventory);
        this.hudElements.set('inventory-display', inventory);
    }

    /**
     * Updates the HUD elements
     */
    public static update(): void {
        // Update health bar, inventory, etc.
        // This would be called from the main game loop
    }

    /**
     * Disposes of the HUD
     */
    public static dispose(): void {
        if (this.hudContainer) {
            this.hudContainer.remove();
            this.hudContainer = null;
        }
        this.hudElements.clear();
        this.scene = null;
        this.characterController = null;
    }
}
