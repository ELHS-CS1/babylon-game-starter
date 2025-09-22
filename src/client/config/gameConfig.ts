/**
 * Game Configuration
 * 
 * This configuration system matches the playground.ts approach
 * with data-driven customizability for all game components.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type HUDPosition = "top" | "bottom" | "left" | "right";
type ItemEffectKind = "superJump" | "invisibility";
type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type ItemType = "jump" | "invisibility" | "health" | "weapon" | "collectible";

interface HUDConfig {
  readonly POSITION: HUDPosition;
  readonly FONT_FAMILY: string;
  readonly PRIMARY_COLOR: string;
  readonly SECONDARY_COLOR: string;
  readonly HIGHLIGHT_COLOR: string;
  readonly BACKGROUND_COLOR: string;
  readonly BACKGROUND_OPACITY: number;
  readonly PADDING: number;
  readonly BORDER_RADIUS: number;
  readonly SHOW_COORDINATES: boolean;
  readonly SHOW_TIME: boolean;
  readonly SHOW_FPS: boolean;
  readonly SHOW_STATE: boolean;
  readonly SHOW_BOOST_STATUS: boolean;
  readonly SHOW_CREDITS: boolean;
  readonly UPDATE_INTERVAL: number;
  readonly MOBILE: {
    readonly SHOW_COORDINATES: boolean;
    readonly SHOW_TIME: boolean;
    readonly SHOW_FPS: boolean;
    readonly SHOW_STATE: boolean;
    readonly SHOW_BOOST_STATUS: boolean;
    readonly SHOW_CREDITS: boolean;
  };
}

interface SettingsSection {
  readonly title: string;
  readonly uiElement: "toggle" | "dropdown" | "slider";
  readonly visibility: "all" | "mobile" | "iPadWithKeyboard";
  readonly defaultValue: boolean | string | number;
  readonly options?: string[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly onChange?: () => void | Promise<void>;
}

interface SettingsConfig {
  readonly HEADING_TEXT: string;
  readonly PANEL_WIDTH_RATIO: number;
  readonly FULL_SCREEN_THRESHOLD: number;
  readonly Z_INDEX: number;
  readonly BUTTON_Z_INDEX: number;
  readonly SECTIONS: readonly SettingsSection[];
}

interface InventoryItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ItemType;
  readonly rarity: ItemRarity;
  readonly quantity: number;
  readonly effect?: ItemEffectKind;
  readonly value?: number;
}

interface InventoryConfig {
  readonly HEADING_TEXT: string;
  readonly PANEL_WIDTH_RATIO: number;
  readonly FULL_SCREEN_THRESHOLD: number;
  readonly Z_INDEX: number;
  readonly BUTTON_Z_INDEX: number;
  readonly TILES: readonly InventoryItem[];
}

interface AudioConfig {
  readonly MASTER_VOLUME: number;
  readonly SFX_VOLUME: number;
  readonly MUSIC_VOLUME: number;
  readonly ENABLE_SFX: boolean;
  readonly ENABLE_MUSIC: boolean;
}

interface GameConfig {
  readonly HUD: HUDConfig;
  readonly SETTINGS: SettingsConfig;
  readonly INVENTORY: InventoryConfig;
  readonly AUDIO: AudioConfig;
  readonly CHARACTERS: readonly string[];
  readonly ENVIRONMENTS: readonly string[];
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const CONFIG: GameConfig = {
  // HUD Configuration - SACRED TEXT FROM PLAYGROUND.TS
  HUD: {
    POSITION: "top",
    FONT_FAMILY: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
    PRIMARY_COLOR: "#ffffff",
    SECONDARY_COLOR: "#cccccc",
    HIGHLIGHT_COLOR: "#00ff88",
    BACKGROUND_COLOR: "#000000",
    BACKGROUND_OPACITY: 0.7,
    PADDING: 15,
    BORDER_RADIUS: 8,
    SHOW_COORDINATES: true,
    SHOW_TIME: true,
    SHOW_FPS: true,
    SHOW_STATE: true,
    SHOW_BOOST_STATUS: true,
    SHOW_CREDITS: true,
    UPDATE_INTERVAL: 100, // milliseconds
    MOBILE: {
      SHOW_COORDINATES: false,
      SHOW_TIME: false,
      SHOW_FPS: false,
      SHOW_STATE: true,
      SHOW_BOOST_STATUS: true,
      SHOW_CREDITS: true
    }
  },

  // Settings Panel Configuration
  SETTINGS: {
    HEADING_TEXT: "Settings",
    PANEL_WIDTH_RATIO: 1 / 3,
    FULL_SCREEN_THRESHOLD: 500,
    Z_INDEX: 1800,
    BUTTON_Z_INDEX: 2000,
    SECTIONS: [
      {
        title: "Character",
        uiElement: "dropdown",
        visibility: "all",
        defaultValue: "Red",
        options: ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"],
        onChange: async () => {
          // Character change handled by component
        }
      },
      {
        title: "Environment",
        uiElement: "dropdown",
        visibility: "all",
        defaultValue: "levelTest",
        options: ["levelTest", "islandTown", "joyTown", "mansion", "firefoxReality"],
        onChange: async () => {
          // Environment change handled by component
        }
      },
      {
        title: "Show Coordinates",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "Show Time",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "Show FPS",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "Show Character State",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "Show Boost Status",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "Show Credits",
        uiElement: "toggle",
        visibility: "all",
        defaultValue: true,
        onChange: async () => {
          // HUD settings change handled by component
        }
      },
      {
        title: "HUD Position",
        uiElement: "dropdown",
        visibility: "all",
        defaultValue: "top",
        options: ["top", "bottom", "left", "right"],
        onChange: async () => {
          // HUD position change handled by component
        }
      },
      {
        title: "Master Volume",
        uiElement: "slider",
        visibility: "all",
        defaultValue: 80,
        min: 0,
        max: 100,
        step: 1,
        onChange: async () => {
          // Audio settings change handled by component
        }
      },
      {
        title: "SFX Volume",
        uiElement: "slider",
        visibility: "all",
        defaultValue: 70,
        min: 0,
        max: 100,
        step: 1,
        onChange: async () => {
          // Audio settings change handled by component
        }
      },
      {
        title: "Music Volume",
        uiElement: "slider",
        visibility: "all",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        onChange: async () => {
          // Audio settings change handled by component
        }
      }
    ] as const
  },

  // Inventory Configuration
  INVENTORY: {
    HEADING_TEXT: "Inventory",
    PANEL_WIDTH_RATIO: 1 / 3,
    FULL_SCREEN_THRESHOLD: 500,
    Z_INDEX: 1800,
    BUTTON_Z_INDEX: 2000,
    TILES: [
      {
        id: "jump_boost_1",
        name: "Jump Boost",
        description: "Increases jump height temporarily",
        type: "jump",
        rarity: "common",
        quantity: 1,
        effect: "superJump",
        value: 10
      },
      {
        id: "invisibility_cloak_1",
        name: "Invisibility Cloak",
        description: "Makes you invisible for a short time",
        type: "invisibility",
        rarity: "rare",
        quantity: 1,
        effect: "invisibility",
        value: 50
      },
      {
        id: "health_potion_1",
        name: "Health Potion",
        description: "Restores health points",
        type: "health",
        rarity: "uncommon",
        quantity: 3,
        value: 25
      },
      {
        id: "legendary_sword_1",
        name: "Legendary Sword",
        description: "A powerful weapon with special abilities",
        type: "weapon",
        rarity: "legendary",
        quantity: 1,
        value: 1000
      },
      {
        id: "gold_coin_1",
        name: "Gold Coin",
        description: "Valuable currency",
        type: "collectible",
        rarity: "common",
        quantity: 15,
        value: 1
      }
    ] as const
  },

  // Audio Configuration
  AUDIO: {
    MASTER_VOLUME: 80,
    SFX_VOLUME: 70,
    MUSIC_VOLUME: 60,
    ENABLE_SFX: true,
    ENABLE_MUSIC: true
  },

  // Available Characters
  CHARACTERS: [
    "Red",
    "Blue", 
    "Green",
    "Yellow",
    "Purple",
    "Orange"
  ] as const,

  // Available Environments
  ENVIRONMENTS: [
    "levelTest",
    "islandTown",
    "joyTown",
    "mansion",
    "firefoxReality"
  ] as const
} as const;

// ============================================================================
// CONFIG UTILITIES
// ============================================================================

/**
 * Gets the current HUD configuration
 */
export const getHUDConfig = (): HUDConfig => CONFIG.HUD;

/**
 * Gets the current settings configuration
 */
export const getSettingsConfig = (): SettingsConfig => CONFIG.SETTINGS;

/**
 * Gets the current inventory configuration
 */
export const getInventoryConfig = (): InventoryConfig => CONFIG.INVENTORY;

/**
 * Gets the current audio configuration
 */
export const getAudioConfig = (): AudioConfig => CONFIG.AUDIO;

/**
 * Gets available characters
 */
export const getCharacters = (): readonly string[] => CONFIG.CHARACTERS;

/**
 * Gets available environments
 */
export const getEnvironments = (): readonly string[] => CONFIG.ENVIRONMENTS;

/**
 * Updates HUD configuration
 */
export const updateHUDConfig = (newConfig: Partial<HUDConfig>): void => {
  Object.assign(CONFIG.HUD, newConfig);
  window.dispatchEvent(new CustomEvent('hud-config-updated', { detail: newConfig }));
};

/**
 * Updates audio configuration
 */
export const updateAudioConfig = (newConfig: Partial<AudioConfig>): void => {
  Object.assign(CONFIG.AUDIO, newConfig);
  window.dispatchEvent(new CustomEvent('audio-config-updated', { detail: newConfig }));
};

/**
 * Checks if device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
};

/**
 * Gets HUD visibility settings based on device type
 */
export const getHUDVisibility = () => {
  const isMobileDevice = isMobile();
  return isMobileDevice ? CONFIG.HUD.MOBILE : CONFIG.HUD;
};

export default CONFIG;
