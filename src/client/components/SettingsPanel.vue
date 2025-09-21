<template>
  <!-- Settings Toggle Button -->
  <v-btn
    v-if="!isOpen"
    class="settings-toggle-btn"
    icon="mdi-cog"
    size="large"
    color="grey-darken-3"
    variant="elevated"
    @click="openPanel"
  />

  <!-- Settings Panel -->
  <v-navigation-drawer
    v-model="isOpen"
    temporary
    location="right"
    width="400"
    class="settings-panel"
  >
    <v-card class="h-100" color="grey-darken-4">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="blue-lighten-2" class="me-2">mdi-cog</v-icon>
          <span class="text-h6 font-weight-bold">Settings</span>
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
      <v-card-text class="pa-4">
        <v-form>
          <!-- Character Selection -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-2 d-block">
              <v-icon color="purple-lighten-2" class="me-2">mdi-account</v-icon>
              Character
            </v-label>
            <v-select
              v-model="selectedCharacter"
              :items="characters"
              variant="outlined"
              density="comfortable"
              color="blue-lighten-2"
              bg-color="grey-darken-3"
              @update:model-value="onCharacterChange"
            />
          </div>

          <!-- Environment Selection -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-2 d-block">
              <v-icon color="green-lighten-2" class="me-2">mdi-earth</v-icon>
              Environment
            </v-label>
            <v-select
              v-model="selectedEnvironment"
              :items="environments"
              variant="outlined"
              density="comfortable"
              color="blue-lighten-2"
              bg-color="grey-darken-3"
              @update:model-value="onEnvironmentChange"
            />
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
import { ref, reactive } from 'vue';
import CONFIG, { getCharacters, getEnvironments } from '../config/gameConfig';

// Props
interface Props {
  characters?: string[];
  environments?: string[];
  initialCharacter?: string;
  initialEnvironment?: string;
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => getCharacters(),
  environments: () => getEnvironments(),
  initialCharacter: () => getCharacters()[0],
  initialEnvironment: () => getEnvironments()[0]
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
}>();

// Reactive state
const isOpen = ref(false);
const selectedCharacter = ref(props.initialCharacter);
const selectedEnvironment = ref(props.initialEnvironment);
const hudPosition = ref(CONFIG.HUD.POSITION);

const hudSettings = reactive({
  showCoordinates: CONFIG.HUD.SHOW_COORDINATES,
  showTime: CONFIG.HUD.SHOW_TIME,
  showFPS: CONFIG.HUD.SHOW_FPS,
  showState: CONFIG.HUD.SHOW_STATE,
  showBoost: CONFIG.HUD.SHOW_BOOST_STATUS,
  showCredits: CONFIG.HUD.SHOW_CREDITS
});

const audioSettings = reactive({
  masterVolume: CONFIG.AUDIO.MASTER_VOLUME,
  sfxVolume: CONFIG.AUDIO.SFX_VOLUME,
  musicVolume: CONFIG.AUDIO.MUSIC_VOLUME
});

const hudPositions = [
  { title: 'Top', value: 'top' },
  { title: 'Bottom', value: 'bottom' },
  { title: 'Left', value: 'left' },
  { title: 'Right', value: 'right' }
];

// Computed properties
// const settingsConfig = computed(() => getSettingsConfig());

// Methods
const openPanel = () => {
  isOpen.value = true;
};

const closePanel = () => {
  isOpen.value = false;
};

const onCharacterChange = (character: string) => {
  emit('characterChange', character);
};

const onEnvironmentChange = (environment: string) => {
  emit('environmentChange', environment);
};

const onHUDSettingsChange = () => {
  emit('hudSettingsChange', { ...hudSettings });
};

const onHUDPositionChange = (position: string) => {
  emit('hudPositionChange', position);
};

const onAudioSettingsChange = () => {
  emit('audioSettingsChange', { ...audioSettings });
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
    showCredits: CONFIG.HUD.SHOW_CREDITS
  });
  
  Object.assign(audioSettings, {
    masterVolume: CONFIG.AUDIO.MASTER_VOLUME,
    sfxVolume: CONFIG.AUDIO.SFX_VOLUME,
    musicVolume: CONFIG.AUDIO.MUSIC_VOLUME
  });
  
  emit('settingsReset');
};

// Expose methods
defineExpose({
  openPanel,
  closePanel,
  isOpen: () => isOpen.value
});
</script>

<style scoped>
.settings-toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  background: rgba(20, 20, 20, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(60, 60, 60, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.settings-toggle-btn:hover {
  background: rgba(30, 30, 30, 0.95) !important;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.settings-panel {
  background: rgba(15, 15, 15, 0.98) !important;
  backdrop-filter: blur(20px);
}

.settings-panel :deep(.v-navigation-drawer__content) {
  background: transparent;
}

.settings-panel :deep(.v-card) {
  background: rgba(20, 20, 20, 0.95) !important;
  border: 1px solid rgba(45, 45, 45, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.settings-panel :deep(.v-label) {
  color: #e0e0e0 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.settings-panel :deep(.v-select .v-field) {
  background: rgba(30, 30, 30, 0.8) !important;
  border: 1px solid rgba(60, 60, 60, 0.6);
}

.settings-panel :deep(.v-switch .v-selection-control__input) {
  color: #64b5f6 !important;
}

.settings-panel :deep(.v-slider .v-slider-track__fill) {
  background: linear-gradient(90deg, #64b5f6, #42a5f5) !important;
}

.settings-panel :deep(.v-slider .v-slider-thumb__surface) {
  background: #64b5f6 !important;
  box-shadow: 0 2px 8px rgba(100, 181, 246, 0.4);
}

/* Custom scrollbar for dark theme */
.settings-panel :deep(.v-card-text) {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 181, 246, 0.3) rgba(30, 30, 30, 0.5);
}

.settings-panel :deep(.v-card-text)::-webkit-scrollbar {
  width: 6px;
}

.settings-panel :deep(.v-card-text)::-webkit-scrollbar-track {
  background: rgba(30, 30, 30, 0.5);
  border-radius: 3px;
}

.settings-panel :deep(.v-card-text)::-webkit-scrollbar-thumb {
  background: rgba(100, 181, 246, 0.3);
  border-radius: 3px;
}

.settings-panel :deep(.v-card-text)::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 181, 246, 0.5);
}
</style>
