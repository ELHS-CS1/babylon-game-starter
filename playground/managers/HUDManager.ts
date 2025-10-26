// ============================================================================
// HUD MANAGER
// ============================================================================

import { CONFIG } from '../config/game-config';
import type { CharacterController } from '../controllers/CharacterController';

export class HUDManager {
    private static hudContainer: HTMLDivElement | null = null;
    private static hudElements: Map<string, HTMLDivElement> = new Map();
    private static scene: BABYLON.Scene | null = null;
    private static characterController: CharacterController | null = null;
    private static startTime: number = 0;
    private static lastUpdateTime: number = 0;
    private static updateInterval: number | null = null;
    private static fpsCounter: number = 0;
    private static fpsLastTime: number = 0;
    private static currentFPS: number = 0;

    /**
     * Initializes the HUD with a scene and character controller
     */
    public static initialize(scene: BABYLON.Scene, characterController: CharacterController): void {
        // Clean up any existing HUD before creating a new one
        if (this.hudContainer) {
            this.dispose();
        }

        this.scene = scene;
        this.characterController = characterController;
        this.startTime = Date.now();
        this.createHUD();

        // Detect if this is a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);

        // Set initial visibility for all HUD elements based on device type
        this.setElementVisibility('coordinates', isMobile ? CONFIG.HUD.MOBILE.SHOW_COORDINATES : CONFIG.HUD.SHOW_COORDINATES);
        this.setElementVisibility('time', isMobile ? CONFIG.HUD.MOBILE.SHOW_TIME : CONFIG.HUD.SHOW_TIME);
        this.setElementVisibility('fps', isMobile ? CONFIG.HUD.MOBILE.SHOW_FPS : CONFIG.HUD.SHOW_FPS);
        this.setElementVisibility('state', isMobile ? CONFIG.HUD.MOBILE.SHOW_STATE : CONFIG.HUD.SHOW_STATE);
        this.setElementVisibility('boost', isMobile ? CONFIG.HUD.MOBILE.SHOW_BOOST_STATUS : CONFIG.HUD.SHOW_BOOST_STATUS);
        this.setElementVisibility('credits', isMobile ? CONFIG.HUD.MOBILE.SHOW_CREDITS : CONFIG.HUD.SHOW_CREDITS);

        // Start the update loop
        this.startUpdateLoop();
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
        this.hudContainer.style.fontFamily = CONFIG.HUD.FONT_FAMILY;
        this.hudContainer.style.color = CONFIG.HUD.PRIMARY_COLOR;
        document.body.appendChild(this.hudContainer);

        // Create all HUD elements
        this.createCoordinates();
        this.createTime();
        this.createFPS();
        this.createState();
        this.createBoostStatus();
        this.createCredits();
        this.createCrosshair();
    }

    /**
     * Creates the coordinates display
     */
    private static createCoordinates(): void {
        const coords = document.createElement('div');
        coords.id = 'hud-coordinates';
        coords.className = 'hud-element';
        coords.style.position = 'absolute';
        coords.style.top = '20px';
        coords.style.left = '20px';
        coords.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        coords.style.padding = `${CONFIG.HUD.PADDING}px`;
        coords.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        coords.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        coords.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">Position</div>
            <div id="hud-coordinates-value" style="color: ${CONFIG.HUD.PRIMARY_COLOR}; font-size: 14px; font-weight: bold;">0.0, 0.0, 0.0</div>
        `;
        this.hudContainer?.appendChild(coords);
        this.hudElements.set('coordinates', coords);
    }

    /**
     * Creates the time display
     */
    private static createTime(): void {
        const time = document.createElement('div');
        time.id = 'hud-time';
        time.className = 'hud-element';
        time.style.position = 'absolute';
        time.style.top = '20px';
        time.style.right = '20px';
        time.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        time.style.padding = `${CONFIG.HUD.PADDING}px`;
        time.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        time.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        time.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">Time</div>
            <div id="hud-time-value" style="color: ${CONFIG.HUD.PRIMARY_COLOR}; font-size: 14px; font-weight: bold;">00:00</div>
        `;
        this.hudContainer?.appendChild(time);
        this.hudElements.set('time', time);
    }

    /**
     * Creates the FPS display
     */
    private static createFPS(): void {
        const fps = document.createElement('div');
        fps.id = 'hud-fps';
        fps.className = 'hud-element';
        fps.style.position = 'absolute';
        fps.style.top = '80px';
        fps.style.right = '20px';
        fps.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        fps.style.padding = `${CONFIG.HUD.PADDING}px`;
        fps.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        fps.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        fps.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">FPS</div>
            <div id="hud-fps-value" style="color: ${CONFIG.HUD.PRIMARY_COLOR}; font-size: 14px; font-weight: bold;">60</div>
        `;
        this.hudContainer?.appendChild(fps);
        this.hudElements.set('fps', fps);
    }

    /**
     * Creates the character state display
     */
    private static createState(): void {
        const state = document.createElement('div');
        state.id = 'hud-state';
        state.className = 'hud-element';
        state.style.position = 'absolute';
        state.style.bottom = '20px';
        state.style.left = '20px';
        state.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        state.style.padding = `${CONFIG.HUD.PADDING}px`;
        state.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        state.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        state.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">State</div>
            <div id="hud-state-value" style="color: ${CONFIG.HUD.PRIMARY_COLOR}; font-size: 14px; font-weight: bold;">Idle</div>
        `;
        this.hudContainer?.appendChild(state);
        this.hudElements.set('state', state);
    }

    /**
     * Creates the boost status display
     */
    private static createBoostStatus(): void {
        const boost = document.createElement('div');
        boost.id = 'hud-boost';
        boost.className = 'hud-element';
        boost.style.position = 'absolute';
        boost.style.bottom = '20px';
        boost.style.right = '20px';
        boost.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        boost.style.padding = `${CONFIG.HUD.PADDING}px`;
        boost.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        boost.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        boost.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">Boost</div>
            <div id="hud-boost-value" style="color: ${CONFIG.HUD.PRIMARY_COLOR}; font-size: 14px; font-weight: bold;">Ready</div>
        `;
        this.hudContainer?.appendChild(boost);
        this.hudElements.set('boost', boost);
    }

    /**
     * Creates the credits display
     */
    private static createCredits(): void {
        const credits = document.createElement('div');
        credits.id = 'hud-credits';
        credits.className = 'hud-element';
        credits.style.position = 'absolute';
        credits.style.top = '50%';
        credits.style.left = '20px';
        credits.style.transform = 'translateY(-50%)';
        credits.style.backgroundColor = `rgba(${this.hexToRgb(CONFIG.HUD.BACKGROUND_COLOR)}, ${CONFIG.HUD.BACKGROUND_OPACITY})`;
        credits.style.padding = `${CONFIG.HUD.PADDING}px`;
        credits.style.borderRadius = `${CONFIG.HUD.BORDER_RADIUS}px`;
        credits.style.border = `1px solid ${CONFIG.HUD.SECONDARY_COLOR}`;
        credits.innerHTML = `
            <div style="color: ${CONFIG.HUD.SECONDARY_COLOR}; font-size: 12px; margin-bottom: 5px;">Credits</div>
            <div id="hud-credits-value" style="color: ${CONFIG.HUD.HIGHLIGHT_COLOR}; font-size: 16px; font-weight: bold;">0</div>
        `;
        this.hudContainer?.appendChild(credits);
        this.hudElements.set('credits', credits);
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
        crosshair.style.border = `2px solid ${CONFIG.HUD.PRIMARY_COLOR}`;
        crosshair.style.borderRadius = '50%';
        crosshair.style.pointerEvents = 'none';
        this.hudContainer?.appendChild(crosshair);
        this.hudElements.set('crosshair', crosshair);
    }

    /**
     * Starts the HUD update loop
     */
    private static startUpdateLoop(): void {
        this.updateInterval = window.setInterval(() => this.updateHUD(), CONFIG.HUD.UPDATE_INTERVAL);
    }

    /**
     * Updates all HUD elements
     */
    private static updateHUD(): void {
        if (!this.scene || !this.characterController) return;

        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < CONFIG.HUD.UPDATE_INTERVAL) return;
        this.lastUpdateTime = currentTime;

        // Detect if this is a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);
        
        // Detect iPad with keyboard
        const isIPadWithKeyboard = this.isIPadWithKeyboard();

        // Update coordinates
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_COORDINATES : CONFIG.HUD.SHOW_COORDINATES)) {
            this.updateCoordinates();
            this.setElementVisibility('coordinates', true);
        } else {
            this.setElementVisibility('coordinates', false);
        }

        // Update time
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_TIME : CONFIG.HUD.SHOW_TIME)) {
            this.updateTime();
            this.setElementVisibility('time', true);
        } else {
            this.setElementVisibility('time', false);
        }

        // Update FPS
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_FPS : CONFIG.HUD.SHOW_FPS)) {
            this.updateFPS();
            this.setElementVisibility('fps', true);
        } else {
            this.setElementVisibility('fps', false);
        }

        // Update state
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_STATE : CONFIG.HUD.SHOW_STATE)) {
            this.updateState();
            this.setElementVisibility('state', true);
        } else {
            this.setElementVisibility('state', false);
        }

        // Update boost status
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_BOOST_STATUS : CONFIG.HUD.SHOW_BOOST_STATUS)) {
            this.updateBoostStatus();
            this.setElementVisibility('boost', true);
        } else {
            this.setElementVisibility('boost', false);
        }

        // Update credits
        if (isIPadWithKeyboard || (isMobile ? CONFIG.HUD.MOBILE.SHOW_CREDITS : CONFIG.HUD.SHOW_CREDITS)) {
            this.updateCredits();
            this.setElementVisibility('credits', true);
        } else {
            this.setElementVisibility('credits', false);
        }
    }

    /**
     * Updates the coordinates display
     */
    private static updateCoordinates(): void {
        const element = this.hudElements.get('coordinates');
        if (!element || !this.characterController) return;

        const position = this.characterController.getPosition();
        const coordsValue = element.querySelector('#hud-coordinates-value');
        if (coordsValue) {
            coordsValue.textContent = `${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`;
        }
    }

    /**
     * Updates the time display
     */
    private static updateTime(): void {
        const element = this.hudElements.get('time');
        if (!element) return;

        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeValue = element.querySelector('#hud-time-value');
        if (timeValue) {
            timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Updates the FPS display
     */
    private static updateFPS(): void {
        const element = this.hudElements.get('fps');
        if (!element || !this.scene) return;

        this.fpsCounter++;
        const currentTime = Date.now();
        
        if (currentTime - this.fpsLastTime >= 1000) {
            this.currentFPS = Math.round((this.fpsCounter * 1000) / (currentTime - this.fpsLastTime));
            this.fpsCounter = 0;
            this.fpsLastTime = currentTime;
        }

        const fpsValue = element.querySelector('#hud-fps-value') as HTMLElement;
        if (fpsValue) {
            fpsValue.textContent = this.currentFPS.toString();
            fpsValue.style.color = this.currentFPS < 30 ? '#ff4444' : CONFIG.HUD.PRIMARY_COLOR;
        }
    }

    /**
     * Updates the character state display
     */
    private static updateState(): void {
        const element = this.hudElements.get('state');
        if (!element || !this.characterController) return;

        const state = this.characterController.getCurrentState();
        const stateValue = element.querySelector('#hud-state-value') as HTMLElement;
        if (stateValue) {
            stateValue.textContent = state;
            stateValue.style.color = this.getStateColor(state);
        }
    }

    /**
     * Updates the boost status display
     */
    private static updateBoostStatus(): void {
        const element = this.hudElements.get('boost');
        if (!element || !this.characterController) return;

        const boostStatus = this.characterController.getBoostStatus();
        const boostValue = element.querySelector('#hud-boost-value') as HTMLElement;
        if (boostValue) {
            boostValue.textContent = boostStatus;
            boostValue.style.color = this.getBoostColor(boostStatus);
        }
    }

    /**
     * Updates the credits display
     */
    private static updateCredits(): void {
        const element = this.hudElements.get('credits');
        if (!element) return;

        // Get credits from CollectiblesManager or other source
        const credits = 0; // TODO: Get actual credits
        const creditsValue = element.querySelector('#hud-credits-value');
        if (creditsValue) {
            creditsValue.textContent = credits.toString();
        }
    }

    /**
     * Sets the visibility of a HUD element
     */
    private static setElementVisibility(elementId: string, visible: boolean): void {
        const element = this.hudElements.get(elementId);
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Gets the color for a character state
     */
    private static getStateColor(state: string): string {
        switch (state.toLowerCase()) {
            case 'idle': return CONFIG.HUD.SECONDARY_COLOR;
            case 'walking': return '#4488ff';
            case 'running': return '#44ff88';
            case 'jumping': return '#ffaa44';
            case 'falling': return '#ff4444';
            default: return CONFIG.HUD.PRIMARY_COLOR;
        }
    }

    /**
     * Gets the color for boost status
     */
    private static getBoostColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'active':
            case 'ready': return '#44ff44';
            case 'inactive':
            case 'cooldown': return '#ff4444';
            default: return CONFIG.HUD.SECONDARY_COLOR;
        }
    }

    /**
     * Checks if this is an iPad with keyboard
     */
    private static isIPadWithKeyboard(): boolean {
        return /iPad/.test(navigator.userAgent) && navigator.maxTouchPoints > 0;
    }

    /**
     * Converts hex color to RGB values
     */
    private static hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '0, 0, 0';
    }

    /**
     * Disposes of the HUD
     */
    public static dispose(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.hudContainer) {
            this.hudContainer.remove();
            this.hudContainer = null;
        }
        
        this.hudElements.clear();
        this.scene = null;
        this.characterController = null;
    }
}