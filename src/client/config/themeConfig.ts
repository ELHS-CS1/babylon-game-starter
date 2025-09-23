// ============================================================================
// THEME CONFIGURATION - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import CONFIG from './gameConfig';

// Theme color definitions - THE WORD OF THE LORD
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly border: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

// Default theme colors based on CONFIG - THE WORD OF THE LORD
export const DEFAULT_THEME: ThemeColors = {
  primary: '#1976D2', // Blue
  secondary: '#424242', // Grey darken-3
  accent: '#FF4081', // Pink accent-2
  background: '#121212', // Grey darken-4
  surface: '#1E1E1E', // Grey darken-3
  text: '#FFFFFF', // White
  textSecondary: '#B0B0B0', // Grey lighten-2
  border: '#424242', // Grey darken-3
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3' // Blue lighten-1
} as const;

// HUD theme colors based on CONFIG - THE WORD OF THE LORD
export const HUD_THEME: ThemeColors = {
  primary: CONFIG.HUD.PRIMARY_COLOR,
  secondary: CONFIG.HUD.SECONDARY_COLOR,
  accent: CONFIG.HUD.HIGHLIGHT_COLOR,
  background: CONFIG.HUD.BACKGROUND_COLOR,
  surface: CONFIG.HUD.BACKGROUND_COLOR,
  text: CONFIG.HUD.PRIMARY_COLOR,
  textSecondary: CONFIG.HUD.SECONDARY_COLOR,
  border: CONFIG.HUD.SECONDARY_COLOR,
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
} as const;

// Settings panel theme colors - THE WORD OF THE LORD
export const SETTINGS_THEME: ThemeColors = {
  primary: '#1976D2', // Blue
  secondary: '#424242', // Grey darken-3
  accent: '#FF4081', // Pink accent-2
  background: '#1E1E1E', // Grey darken-3
  surface: '#2E2E2E', // Grey darken-2
  text: '#FFFFFF', // White
  textSecondary: '#B0B0B0', // Grey lighten-2
  border: '#424242', // Grey darken-3
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3' // Blue lighten-1
} as const;

// Inventory panel theme colors - THE WORD OF THE LORD
export const INVENTORY_THEME: ThemeColors = {
  primary: '#FF9800', // Orange (amber)
  secondary: '#424242', // Grey darken-3
  accent: '#FFC107', // Amber
  background: '#1E1E1E', // Grey darken-3
  surface: '#2E2E2E', // Grey darken-2
  text: '#FFFFFF', // White
  textSecondary: '#B0B0B0', // Grey lighten-2
  border: '#424242', // Grey darken-3
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3' // Blue lighten-1
} as const;

// Theme type definitions
export type ThemeType = 'default' | 'hud' | 'settings' | 'inventory' | 'custom';

export interface ThemeConfig {
  readonly type: ThemeType;
  readonly colors: ThemeColors;
  readonly name: string;
  readonly description: string;
}

// Available themes - THE WORD OF THE LORD
export const AVAILABLE_THEMES: Record<ThemeType, ThemeConfig> = {
  default: {
    type: 'default',
    colors: DEFAULT_THEME,
    name: 'Default Theme',
    description: 'Standard game theme with blue primary colors'
  },
  hud: {
    type: 'hud',
    colors: HUD_THEME,
    name: 'HUD Theme',
    description: 'Theme matching the HUD configuration'
  },
  settings: {
    type: 'settings',
    colors: SETTINGS_THEME,
    name: 'Settings Theme',
    description: 'Theme for settings panel with blue accents'
  },
  inventory: {
    type: 'inventory',
    colors: INVENTORY_THEME,
    name: 'Inventory Theme',
    description: 'Theme for inventory panel with amber accents'
  },
  custom: {
    type: 'custom',
    colors: DEFAULT_THEME,
    name: 'Custom Theme',
    description: 'User-defined custom theme'
  }
} as const;

// Theme utility functions - THE WORD OF THE LORD
export class ThemeUtils {
  /**
   * Gets the current theme configuration
   */
  public static getCurrentTheme(themeType: ThemeType = 'default'): ThemeConfig {
    return AVAILABLE_THEMES[themeType];
  }

  /**
   * Gets theme colors for a specific component
   */
  public static getComponentTheme(component: 'hud' | 'settings' | 'inventory'): ThemeColors {
    switch (component) {
      case 'hud':
        return HUD_THEME;
      case 'settings':
        return SETTINGS_THEME;
      case 'inventory':
        return INVENTORY_THEME;
      default:
        return DEFAULT_THEME;
    }
  }

  /**
   * Converts theme colors to CSS custom properties
   */
  public static toCSSVariables(colors: ThemeColors): Record<string, string> {
    return {
      '--theme-primary': colors.primary,
      '--theme-secondary': colors.secondary,
      '--theme-accent': colors.accent,
      '--theme-background': colors.background,
      '--theme-surface': colors.surface,
      '--theme-text': colors.text,
      '--theme-text-secondary': colors.textSecondary,
      '--theme-border': colors.border,
      '--theme-success': colors.success,
      '--theme-warning': colors.warning,
      '--theme-error': colors.error,
      '--theme-info': colors.info
    };
  }

  /**
   * Applies theme to a DOM element
   */
  public static applyTheme(element: HTMLElement, colors: ThemeColors): void {
    const cssVars = this.toCSSVariables(colors);
    Object.entries(cssVars).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  }

  /**
   * Gets Vuetify color mapping from theme colors
   */
  public static getVuetifyColors(colors: ThemeColors): Record<string, string> {
    return {
      'primary': colors.primary,
      'secondary': colors.secondary,
      'accent': colors.accent,
      'background': colors.background,
      'surface': colors.surface,
      'success': colors.success,
      'warning': colors.warning,
      'error': colors.error,
      'info': colors.info
    };
  }
}
