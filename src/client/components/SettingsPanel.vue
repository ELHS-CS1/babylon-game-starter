<template>
  <!-- Settings Toggle Button -->
  <v-btn
    class="settings-toggle-btn"
    size="large"
    color="primary"
    variant="elevated"
    @click="togglePanel"
  >
    <v-icon>mdi-cog</v-icon>
  </v-btn>

  <!-- Settings Panel -->
  <v-navigation-drawer
    v-model="isOpen"
    temporary
    location="left"
    :width="panelWidth"
    class="settings-panel"
    :z-index="CONFIG.SETTINGS.Z_INDEX"
  >
    <v-card class="h-100" color="grey-darken-4">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="blue-lighten-2" class="me-2">mdi-cog</v-icon>
          <span class="text-h6 font-weight-bold">{{ headingText }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-lighten-1"
          @click="closePanel"
        />
      </v-card-title>

      <v-divider color="grey-darken-2" />

      <!-- Settings Content -->
      <v-card-text class="pa-4 settings-content">
        <v-form>
          <!-- Dynamic Settings Sections from THE WORD OF THE LORD -->
          <div 
            v-for="section in settingsSections" 
            :key="section.title"
            class="mb-6"
          >
            <v-label class="text-subtitle-1 font-weight-medium mb-2 d-block">
              <v-icon 
                :color="getSectionIconColor(section.title)" 
                class="me-2"
              >
                {{ getSectionIcon(section.title) }}
              </v-icon>
              {{ section.title }}
            </v-label>
            
            <!-- Toggle Switch -->
            <v-switch
              v-if="section.uiElement === 'toggle'"
              v-model="toggleValues[section.title]"
              :label="section.title"
              color="primary"
              density="comfortable"
              @update:model-value="(value) => onSectionChange(section, value)"
            />
            
            <!-- Dropdown Select -->
            <v-select
              v-else-if="section.uiElement === 'dropdown'"
              v-model="dropdownValues[section.title]"
              :items="SettingsData.getSectionOptions(section)"
              variant="outlined"
              :color="getSectionIconColor(section.title)"
              density="comfortable"
              bg-color="grey-darken-3"
              @update:model-value="(value) => onSectionChange(section, value)"
            />
          </div>

          <!-- Game Controls -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="red-lighten-2" class="me-2">mdi-gamepad-variant</v-icon>
              Game Controls
            </v-label>
            
            <div class="d-flex flex-column gap-3">
              <v-btn
                :color="isConnected ? 'error' : 'primary'"
                variant="elevated"
                block
                @click="isConnected ? leaveGame() : joinGame()"
              >
                <v-icon left>{{ isConnected ? 'mdi-logout' : 'mdi-login' }}</v-icon>
                {{ isConnected ? 'Leave Game' : 'Join Game' }}
              </v-btn>
            </div>
          </div>

          <!-- HUD Settings -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="orange-lighten-2" class="me-2">mdi-monitor-dashboard</v-icon>
              HUD Display
            </v-label>
            
            <v-switch
              v-model="hudSettings.showCoordinates"
              label="Show Coordinates"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showTime"
              label="Show Time"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showFPS"
              label="Show FPS"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showState"
              label="Show Character State"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showBoost"
              label="Show Boost Status"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showCredits"
              label="Show Credits"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showPlayers"
              label="Show Players Count"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
            
            <v-switch
              v-model="hudSettings.showConnection"
              label="Show Connection Status"
              color="blue-lighten-2"
              density="comfortable"
              @update:model-value="onHUDSettingsChange"
            />
          </div>

          <!-- HUD Position -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-2 d-block">
              <v-icon color="cyan-lighten-2" class="me-2">mdi-arrow-all</v-icon>
              HUD Position
            </v-label>
            <v-select
              v-model="hudPosition"
              :items="hudPositions"
              variant="outlined"
              density="comfortable"
              color="blue-lighten-2"
              bg-color="grey-darken-3"
              @update:model-value="onHUDPositionChange"
            />
          </div>

          <!-- Audio Settings -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="pink-lighten-2" class="me-2">mdi-volume-high</v-icon>
              Audio
            </v-label>
            
            <v-slider
              v-model="audioSettings.masterVolume"
              label="Master Volume"
              min="0"
              max="100"
              step="1"
              color="blue-lighten-2"
              track-color="grey-darken-2"
              thumb-color="blue-lighten-2"
              @update:model-value="onAudioSettingsChange"
            />
            
            <v-slider
              v-model="audioSettings.sfxVolume"
              label="SFX Volume"
              min="0"
              max="100"
              step="1"
              color="green-lighten-2"
              track-color="grey-darken-2"
              thumb-color="green-lighten-2"
              @update:model-value="onAudioSettingsChange"
            />
            
            <v-slider
              v-model="audioSettings.musicVolume"
              label="Music Volume"
              min="0"
              max="100"
              step="1"
              color="purple-lighten-2"
              track-color="grey-darken-2"
              thumb-color="purple-lighten-2"
              @update:model-value="onAudioSettingsChange"
            />
          </div>

          <!-- Inspector Settings -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="amber-lighten-2" class="me-2">mdi-bug</v-icon>
              Debug Inspector
            </v-label>
            
            <v-switch
              v-model="inspectorEnabled"
              label="Enable Babylon.js Inspector"
              color="amber-lighten-2"
              density="comfortable"
              @update:model-value="onInspectorToggle"
            />
            
            <v-alert
              v-if="inspectorEnabled"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              Inspector is now active! Use the scene explorer to debug sound, physics, and scene objects.
            </v-alert>
          </div>

          <!-- Procedural Sound Testing -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="green-lighten-2" class="me-2">mdi-music-note</v-icon>
              Procedural Sound Engine
            </v-label>
            
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Test the procedural sound system inspired by v2 audio engine
            </v-alert>
            
            <div class="d-flex flex-column">
              <v-btn
                color="green-lighten-2"
                variant="outlined"
                prepend-icon="mdi-sine-wave"
                class="mb-3"
                @click="testProceduralTone"
              >
                Test Tone (440Hz A)
              </v-btn>
              
              <v-btn
                color="green-lighten-2"
                variant="outlined"
                prepend-icon="mdi-music"
                @click="testChordProgression"
              >
                Test Chord (C Major)
              </v-btn>
            </div>
          </div>
        </v-form>
      </v-card-text>

      <!-- Footer Actions -->
      <v-divider color="grey-darken-2" />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey-lighten-1"
          variant="outlined"
          @click="resetToDefaults"
        >
          <v-icon left>mdi-restore</v-icon>
          Reset
        </v-btn>
        <v-btn
          color="blue-lighten-2"
          variant="elevated"
          @click="saveSettings"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { SettingsData } from '../game/SettingsData';
// import { ThemeUtils } from '../config/themeConfig'; // Unused for now
import CONFIG from '../config/gameConfig';
import { logger } from '../utils/logger';
import { ProceduralSoundManager } from '../game/ProceduralSoundManager';

// Props
interface Props {
  characters?: string[];
  environments?: string[];
  initialCharacter?: string;
  initialEnvironment?: string;
  isConnected?: boolean;
  gameEngine?: Record<string, unknown> | null;
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => SettingsData.getCharacters(),
  environments: () => SettingsData.getEnvironments(),
  initialCharacter: () => SettingsData.getDefaultCharacter(),
  initialEnvironment: () => SettingsData.getDefaultEnvironment(),
  isConnected: () => false,
  gameEngine: () => null
});

// Emits
const emit = defineEmits<{
  'characterChange': [character: string];
  'environmentChange': [environment: string];
  'hudSettingsChange': [settings: Record<string, unknown>];
  'hudPositionChange': [position: string];
  'audioSettingsChange': [settings: Record<string, unknown>];
  'settingsSave': [settings: Record<string, unknown>];
  'settingsReset': [];
  'joinGame': [];
  'leaveGame': [];
}>();

// Reactive state
const isOpen = ref(false);
const selectedCharacter = ref(props.initialCharacter);
const selectedEnvironment = ref(props.initialEnvironment);

// Reactive state for dynamic settings - THE WORD OF THE LORD
const toggleValues = ref<Record<string, boolean>>({});
const dropdownValues = ref<Record<string, string>>({});

// Get settings sections from THE WORD OF THE LORD
const settingsSections = computed(() => SettingsData.getSettingsSections());
const hudPosition = ref(CONFIG.HUD.POSITION);

// Initialize reactive values - THE WORD OF THE LORD
const initializeReactiveValues = () => {
  settingsSections.value.forEach((section: Record<string, unknown>) => {
    const sectionTitle = typeof section.title === 'string' ? section.title : '';
    const uiElement = typeof section.uiElement === 'string' ? section.uiElement : '';
    
    if (uiElement === 'toggle') {
      if (toggleValues.value[sectionTitle] === null || toggleValues.value[sectionTitle] === undefined) {
        if (sectionTitle === 'Screen Controls') {
          toggleValues.value[sectionTitle] = true;
        } else {
          const defaultValue = SettingsData.getDefaultValue(section);
          toggleValues.value[sectionTitle] = typeof defaultValue === 'boolean' ? defaultValue : false;
        }
      }
    } else if (uiElement === 'dropdown') {
      if (dropdownValues.value[sectionTitle] === null || dropdownValues.value[sectionTitle] === undefined) {
        if (sectionTitle === 'Character') {
          dropdownValues.value[sectionTitle] = selectedCharacter.value;
        } else if (sectionTitle === 'Environment') {
          dropdownValues.value[sectionTitle] = selectedEnvironment.value;
        } else {
          const defaultValue = SettingsData.getDefaultValue(section);
          dropdownValues.value[sectionTitle] = typeof defaultValue === 'string' ? defaultValue : '';
        }
      }
    }
  });
};

// Computed values based on config settings - THE WORD OF THE LORD
const panelWidth = computed(() => SettingsData.getPanelWidth());
const headingText = computed(() => SettingsData.getHeadingText());
// const characters = computed(() => SettingsData.getCharacters()); // Unused for now
// const environments = computed(() => SettingsData.getEnvironments()); // Unused for now
// const defaultCharacter = computed(() => SettingsData.getDefaultCharacter()); // Unused for now
// const defaultEnvironment = computed(() => SettingsData.getDefaultEnvironment()); // Unused for now

// Theme configuration - THE WORD OF THE LORD
// const themeColors = computed(() => ThemeUtils.getComponentTheme('settings')); // Unused for now
// const vuetifyColors = computed(() => ThemeUtils.getVuetifyColors(themeColors.value)); // Unused for now

// Helper methods for dynamic settings - THE WORD OF THE LORD
const getSectionIcon = (title: string): string => {
  const iconMap: Record<string, string> = {
    'Screen Controls': 'mdi-gamepad-variant',
    'Character': 'mdi-account',
    'Environment': 'mdi-earth'
  };
  return iconMap[title] ?? 'mdi-cog';
};

const getSectionIconColor = (title: string): string => {
  const colorMap: Record<string, string> = {
    'Screen Controls': 'red-lighten-2',
    'Character': 'purple-lighten-2',
    'Environment': 'green-lighten-2'
  };
  return colorMap[title] ?? 'blue-lighten-2';
};

// const getToggleValue = (section: any): boolean => { // Unused for now
//   if (toggleValues.value[section.title] === null || toggleValues.value[section.title] === undefined) {
//     if (section.title === 'Screen Controls') {
//       toggleValues.value[section.title] = true; // Always default to true for screen controls
//     } else {
//       const defaultValue = SettingsData.getDefaultValue(section);
//       toggleValues.value[section.title] = typeof defaultValue === 'boolean' ? defaultValue : false;
//     }
//   }
//   return toggleValues.value[section.title];
// };

// const getDropdownValue = (section: any): string => { // Unused for now
//   if (!dropdownValues.value[section.title]) {
//     if (section.title === 'Character') {
//       dropdownValues.value[section.title] = selectedCharacter.value;
//     } else if (section.title === 'Environment') {
//       dropdownValues.value[section.title] = selectedEnvironment.value;
//     } else {
//       dropdownValues.value[section.title] = SettingsData.getDefaultValue(section) as string;
//     }
//   }
//   return dropdownValues.value[section.title];
// };

const hudSettings = reactive({
  showCoordinates: CONFIG.HUD.SHOW_COORDINATES,
  showTime: CONFIG.HUD.SHOW_TIME,
  showFPS: CONFIG.HUD.SHOW_FPS,
  showState: CONFIG.HUD.SHOW_STATE,
  showBoost: CONFIG.HUD.SHOW_BOOST_STATUS,
  showCredits: CONFIG.HUD.SHOW_CREDITS,
  showPlayers: true,
  showConnection: true
});

const audioSettings = reactive({
  masterVolume: CONFIG.AUDIO.MASTER_VOLUME,
  sfxVolume: CONFIG.AUDIO.SFX_VOLUME,
  musicVolume: CONFIG.AUDIO.MUSIC_VOLUME
});

const inspectorEnabled = ref(false);

const hudPositions = [
  { title: 'Top', value: 'top' },
  { title: 'Bottom', value: 'bottom' },
  { title: 'Left', value: 'left' },
  { title: 'Right', value: 'right' }
];

// Computed properties

// Methods
const openPanel = () => {
  isOpen.value = true;
};

const closePanel = () => {
  isOpen.value = false;
};

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

// Handle section changes from THE WORD OF THE LORD
const onSectionChange = (section: Record<string, unknown>, value: boolean | string) => {
  const sectionTitle = typeof section.title === 'string' ? section.title : '';
  const uiElement = typeof section.uiElement === 'string' ? section.uiElement : '';
  
  // Update the reactive values
  if (uiElement === 'toggle') {
    toggleValues.value[sectionTitle] = typeof value === 'boolean' ? value : false;
  } else if (uiElement === 'dropdown') {
    dropdownValues.value[sectionTitle] = typeof value === 'string' ? value : '';
  }
  
  if (sectionTitle === 'Character') {
    selectedCharacter.value = typeof value === 'string' ? value : '';
    onCharacterChange(typeof value === 'string' ? value : '');
  } else if (sectionTitle === 'Environment') {
    selectedEnvironment.value = typeof value === 'string' ? value : '';
    onEnvironmentChange(typeof value === 'string' ? value : '');
  } else if (sectionTitle === 'Screen Controls') {
    // Handle screen controls toggle
    // Screen controls changed - handled silently
  }
  
  // Call the section's onChange callback if it exists
  if (section.onChange !== null && section.onChange !== undefined && typeof section.onChange === 'function') {
    try {
      const callback = section.onChange as (value: unknown) => void;
      callback(value);
    } catch {
      // Callback error - handled silently
    }
  }
};

const onCharacterChange = (character: string) => {
  emit('characterChange', character);
};

const onEnvironmentChange = (environment: string) => {
  emit('environmentChange', environment);
};

const onHUDSettingsChange = () => {
  console.log('SettingsPanel: onHUDSettingsChange called, hudSettings:', hudSettings);
  emit('hudSettingsChange', { ...hudSettings });
};

const onHUDPositionChange = (position: string) => {
  emit('hudPositionChange', position);
};

const onAudioSettingsChange = () => {
  emit('audioSettingsChange', { ...audioSettings });
};

const onInspectorToggle = async () => {
  console.log('Inspector toggle called, enabled:', inspectorEnabled.value);
  const windowObj = window as any;
  if (inspectorEnabled.value) {
    console.log('Attempting to show inspector...');
    if (windowObj.showBabylonInspector) {
      console.log('Inspector function found, calling...');
      await windowObj.showBabylonInspector();
      console.log('Inspector function called');
    } else {
      console.warn('Babylon.js Inspector not available. Make sure the scene is loaded.');
      console.log('Available window functions:', Object.keys(windowObj).filter(key => key.includes('inspector') || key.includes('Inspector')));
    }
  } else {
    console.log('Attempting to hide inspector...');
    if (windowObj.hideBabylonInspector) {
      windowObj.hideBabylonInspector();
    }
  }
};

// Procedural Sound Test Functions
const testProceduralTone = async () => {
  try {
    console.log('Testing procedural tone (440Hz A note)...');
    await ProceduralSoundManager.playTestTone();
    logger.info('Procedural tone test completed', 'SettingsPanel');
  } catch (error) {
    console.error('Failed to play procedural tone:', error);
    logger.error(`Procedural tone test failed: ${error}`, 'SettingsPanel');
  }
};

const testChordProgression = async () => {
  try {
    console.log('Testing chord progression (C major)...');
    await ProceduralSoundManager.playChordProgression();
    logger.info('Chord progression test completed', 'SettingsPanel');
  } catch (error) {
    console.error('Failed to play chord progression:', error);
    logger.error(`Chord progression test failed: ${error}`, 'SettingsPanel');
  }
};

const joinGame = () => {
  logger.info('🎮 JOIN GAME BUTTON CLICKED IN SETTINGS PANEL!', { context: 'SettingsPanel', tag: 'game' });
  logger.info('📊 Current connection status:', { context: 'SettingsPanel', tag: 'connection', isConnected: props.isConnected });
  logger.info('📊 GameEngine status:', { context: 'SettingsPanel', tag: 'game', hasGameEngine: !!props.gameEngine });
  logger.info('📊 Props received:', { context: 'SettingsPanel', tag: 'props', isConnected: props.isConnected, gameEngine: !!props.gameEngine });
  logger.info('📊 All props:', { context: 'SettingsPanel', tag: 'props', props });
  emit('joinGame');
};

const leaveGame = () => {
  logger.info('🚪 LEAVE GAME BUTTON CLICKED IN SETTINGS PANEL!', { context: 'SettingsPanel', tag: 'game' });
  logger.info('📊 Current connection status:', { context: 'SettingsPanel', tag: 'connection', isConnected: props.isConnected });
  emit('leaveGame');
};

const saveSettings = () => {
  const settings = {
    character: selectedCharacter.value,
    environment: selectedEnvironment.value,
    hud: {
      position: hudPosition.value,
      settings: { ...hudSettings }
    },
    audio: { ...audioSettings }
  };
  
  emit('settingsSave', settings);
  closePanel();
};

const resetToDefaults = () => {
  selectedCharacter.value = props.initialCharacter;
  selectedEnvironment.value = props.initialEnvironment;
  hudPosition.value = CONFIG.HUD.POSITION;
  
  Object.assign(hudSettings, {
    showCoordinates: CONFIG.HUD.SHOW_COORDINATES,
    showTime: CONFIG.HUD.SHOW_TIME,
    showFPS: CONFIG.HUD.SHOW_FPS,
    showState: CONFIG.HUD.SHOW_STATE,
    showBoost: CONFIG.HUD.SHOW_BOOST_STATUS,
    showCredits: CONFIG.HUD.SHOW_CREDITS,
    showPlayers: true,
    showConnection: true
  });
  
  Object.assign(audioSettings, {
    masterVolume: CONFIG.AUDIO.MASTER_VOLUME,
    sfxVolume: CONFIG.AUDIO.SFX_VOLUME,
    musicVolume: CONFIG.AUDIO.MUSIC_VOLUME
  });
  
  emit('settingsReset');
};

// Initialize reactive values on mount - THE WORD OF THE LORD
onMounted(() => {
  initializeReactiveValues();
});

// Expose methods
defineExpose({
  openPanel,
  closePanel,
  isOpen: () => isOpen.value
});
</script>

<style scoped>
.settings-toggle-btn {
  position: fixed !important;
  bottom: 20px !important;
  left: 20px !important;
  z-index: 2000 !important;
}

.settings-content {
  max-height: calc(100vh - 200px) !important; /* Account for header, footer, and button gap */
  overflow-y: auto !important;
  padding-bottom: 85px !important; /* 5px gap from button (60px button + 20px margin + 5px gap) */
}

.settings-panel {
  bottom: 85px !important; /* 5px gap from button */
}
</style>

