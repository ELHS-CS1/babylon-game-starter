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
    width="400"
    class="settings-panel"
    z-index="1000"
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
      <v-card-text class="pa-4 settings-content">
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

          <!-- Game Controls -->
          <div class="mb-6">
            <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              <v-icon color="red-lighten-2" class="me-2">mdi-gamepad-variant</v-icon>
              Game Controls
            </v-label>
            
            <div class="d-flex flex-column gap-3">
              <v-btn
                color="primary"
                variant="elevated"
                :disabled="isConnected"
                block
                @click="joinGame"
              >
                <v-icon left>mdi-login</v-icon>
                Join Game
              </v-btn>
              
              <v-btn
                color="error"
                variant="elevated"
                :disabled="!isConnected"
                block
                @click="leaveGame"
              >
                <v-icon left>mdi-logout</v-icon>
                Leave Game
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
import CONFIG, { ASSETS } from '../config/gameConfig';

// Props
interface Props {
  characters?: string[];
  environments?: string[];
  initialCharacter?: string;
  initialEnvironment?: string;
  isConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => ASSETS.CHARACTERS.map(char => char.name),
  environments: () => ASSETS.ENVIRONMENTS.map(env => env.name),
  initialCharacter: () => ASSETS.CHARACTERS[0]?.name || 'Red',
  initialEnvironment: () => ASSETS.ENVIRONMENTS[0]?.name || 'Level Test',
  isConnected: () => false
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

const joinGame = () => {
  emit('joinGame');
};

const leaveGame = () => {
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

