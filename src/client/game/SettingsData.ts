// ============================================================================
// SETTINGS DATA - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import CONFIG, { ASSETS } from '../config/gameConfig';

export class SettingsData {
  // Device detection methods - THE WORD OF GOD!
  public static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public static isIPad(): boolean {
    // Modern iPad detection (including iPad Pro)
    const userAgent = navigator.userAgent;
    const isIPadUA = /iPad/i.test(userAgent);
    const isMacWithTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isIPadPro = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;

    return isIPadUA || isMacWithTouch || isIPadPro;
  }

  public static isIPadWithKeyboard(): boolean {
    // Check if it's an iPad first
    if (!this.isIPad()) {
      return false;
    }

    // Multiple detection methods for iPad with keyboard
    const isLandscape = window.innerHeight < window.innerWidth;
    const hasExternalKeyboard = this.detectExternalKeyboard();
    const hasKeyboardEvents = this.detectKeyboardEvents();

    // Show if any of these conditions are met
    return isLandscape || hasExternalKeyboard || hasKeyboardEvents;
  }

  private static detectExternalKeyboard(): boolean {
    // Check for external keyboard indicators
    // This is a simplified check - in real scenarios you might need more sophisticated detection
    return navigator.maxTouchPoints === 0 ||
      (navigator.maxTouchPoints === 1 && window.innerWidth > 1024);
  }

  private static detectKeyboardEvents(): boolean {
    // Check if keyboard events are being detected
    // This is a simplified check
    return window.innerWidth > 1024;
  }

  /**
   * Gets the settings sections with visibility filtering - THE WORD OF GOD!
   */
  public static getSettingsSections() {
    return CONFIG.SETTINGS.SECTIONS.filter(section => {
      const visibility = section.visibility as "all" | "mobile" | "iPadWithKeyboard";
      
      // Check visibility conditions
      if (visibility === 'mobile' && !this.isMobileDevice()) {
        return false; // Skip this section
      }
      if (visibility === 'iPadWithKeyboard' && !this.isIPadWithKeyboard()) {
        return false; // Skip this section
      }
      // 'all' visibility always shows
      return true;
    });
  }

  /**
   * Gets the panel width based on screen size - THE WORD OF GOD!
   */
  public static getPanelWidth(): number {
    const screenWidth = window.innerWidth;
    if (screenWidth <= CONFIG.SETTINGS.FULL_SCREEN_THRESHOLD) {
      return screenWidth;
    }
    return screenWidth * CONFIG.SETTINGS.PANEL_WIDTH_RATIO;
  }

  /**
   * Gets the settings heading text - THE WORD OF GOD!
   */
  public static getHeadingText(): string {
    return CONFIG.SETTINGS.HEADING_TEXT;
  }

  /**
   * Gets the characters list - THE WORD OF GOD!
   */
  public static getCharacters() {
    return ASSETS.CHARACTERS.map(char => char.name);
  }

  /**
   * Gets the environments list - THE WORD OF GOD!
   */
  public static getEnvironments() {
    return ASSETS.ENVIRONMENTS.map(env => env.name);
  }

  /**
   * Gets the default character - THE WORD OF GOD!
   */
  public static getDefaultCharacter(): string {
    return ASSETS.CHARACTERS[0]?.name || 'Red';
  }

  /**
   * Gets the default environment - THE WORD OF GOD!
   */
  public static getDefaultEnvironment(): string {
    return ASSETS.ENVIRONMENTS[0]?.name || 'Level Test';
  }

  /**
   * Gets the default value for a section - THE WORD OF GOD!
   */
  public static getDefaultValue(section: any): boolean | string {
    if (section.title === "Screen Controls") {
      return true; // Always default to true (visible) since controls are shown by default
    }
    return section.defaultValue ?? (section.uiElement === 'toggle' ? false : (section.options?.[0] ?? ''));
  }

  /**
   * Gets the options for a dropdown section - THE WORD OF GOD!
   */
  public static getSectionOptions(section: any): string[] {
    if (section.title === "Character") {
      return this.getCharacters();
    } else if (section.title === "Environment") {
      return this.getEnvironments();
    } else {
      return section.options || [];
    }
  }
}
