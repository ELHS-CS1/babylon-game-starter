// ============================================================================
// HUD SETTINGS COMPOSABLE - VUE 3 BEST PRACTICES
// ============================================================================

import { reactive, computed, provide, inject, type InjectionKey } from 'vue';
import CONFIG from '../config/gameConfig';

// Define the HUD settings interface
export interface HUDSettings {
  showCoordinates: boolean;
  showTime: boolean;
  showFPS: boolean;
  showState: boolean;
  showBoost: boolean;
  showCredits: boolean;
  showPlayers: boolean;
  showConnection: boolean;
}

// Create injection key for type safety
const HUDSettingsKey: InjectionKey<{
  settings: HUDSettings;
  updateSettings: (newSettings: Partial<HUDSettings>) => void;
  resetSettings: () => void;
}> = Symbol('hudSettings');

// Default HUD settings
const defaultSettings: HUDSettings = {
  showCoordinates: CONFIG.HUD.SHOW_COORDINATES,
  showTime: CONFIG.HUD.SHOW_TIME,
  showFPS: CONFIG.HUD.SHOW_FPS,
  showState: CONFIG.HUD.SHOW_STATE,
  showBoost: CONFIG.HUD.SHOW_BOOST_STATUS,
  showCredits: CONFIG.HUD.SHOW_CREDITS,
  showPlayers: true,
  showConnection: true,
};

/**
 * Composable for providing HUD settings to child components
 * This should be used in the parent component (App.vue)
 */
export function useHUDSettingsProvider() {
  // Create reactive settings
  const settings = reactive<HUDSettings>({ ...defaultSettings });

  // Update settings function
  const updateSettings = (newSettings: Partial<HUDSettings>) => {
    Object.assign(settings, newSettings);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    Object.assign(settings, defaultSettings);
  };

  // Provide the settings to child components
  provide(HUDSettingsKey, {
    settings,
    updateSettings,
    resetSettings,
  });

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

/**
 * Composable for injecting HUD settings in child components
 * This should be used in child components (GameHUD.vue)
 */
export function useHUDSettings() {
  const injected = inject(HUDSettingsKey);

  if (!injected) {
    throw new Error('useHUDSettings must be used within a component that provides HUD settings');
  }

  const { settings, updateSettings, resetSettings } = injected;

  // Computed properties for individual settings
  const showCoordinates = computed(() => settings.showCoordinates);
  const showTime = computed(() => settings.showTime);
  const showFPS = computed(() => settings.showFPS);
  const showState = computed(() => settings.showState);
  const showBoost = computed(() => settings.showBoost);
  const showCredits = computed(() => settings.showCredits);
  const showPlayers = computed(() => settings.showPlayers);
  const showConnection = computed(() => settings.showConnection);

  return {
    // Reactive settings object
    settings,
    // Individual computed properties
    showCoordinates,
    showTime,
    showFPS,
    showState,
    showBoost,
    showCredits,
    showPlayers,
    showConnection,
    // Methods
    updateSettings,
    resetSettings,
  };
}
