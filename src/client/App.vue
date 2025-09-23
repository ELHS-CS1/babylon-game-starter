<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <v-row no-gutters>
          <!-- Game Canvas - Full Screen -->
          <v-col cols="12">
            <div id="game-container" class="game-container">
              <canvas id="game-canvas" ref="gameCanvas"/>
              
              <!-- Game HUD -->
              <GameHUD
                ref="gameHUD"
                :position="hudPosition"
                :show-coordinates="hudSettings.showCoordinates"
                :show-time="hudSettings.showTime"
                :show-fps="hudSettings.showFPS"
                :show-state="hudSettings.showState"
                :show-boost="hudSettings.showBoost"
                :show-credits="hudSettings.showCredits"
                :peers="peers"
                :active-peers="activePeersCount"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Settings Panel -->
    <SettingsPanel
      ref="settingsPanel"
      :characters="characters"
      :environments="environments"
      :initial-character="selectedCharacter"
      :initial-environment="selectedEnvironment"
      :is-connected="isConnected"
      @character-change="onCharacterChange"
      @environment-change="onEnvironmentChange"
      @hud-settings-change="onHUDSettingsChange"
      @hud-position-change="onHUDPositionChange"
      @audio-settings-change="onAudioSettingsChange"
      @settings-save="onSettingsSave"
      @settings-reset="onSettingsReset"
      @join-game="joinGame"
      @leave-game="leaveGame"
    />

    <!-- Inventory Panel -->
    <InventoryPanel
      ref="inventoryPanel"
      :items="inventoryItems"
      @item-use="onItemUse"
      @item-drop="onItemDrop"
      @inventory-sort="onInventorySort"
      @inventory-clear="onInventoryClear"
      @item-select="onItemSelect"
    />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue';
import { GameEngine } from './game/GameEngine';
import type { Peer } from './game/Peer';
import config, { logClientConfig } from './config';
import CONFIG, { ASSETS } from './config/gameConfig';
import GameHUD from './components/GameHUD.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import { gameState, activePlayers } from './state';
import { pwaManager } from './utils/pwa';
import { pushNotificationClient } from './services/PushNotificationClient';
// DataStar signals are now handled by the store

// Reactive state
const gameCanvas = ref<HTMLCanvasElement>();
// Fallback values in case getEnvironments/getCharacters return empty arrays

const selectedEnvironment = ref<string>(ASSETS.ENVIRONMENTS[0]?.name ?? 'Level Test');
const selectedCharacter = ref<string>(ASSETS.CHARACTERS[0]?.name ?? 'Red');
const environments = ref<string[]>(ASSETS.ENVIRONMENTS.map(env => env.name));
const characters = ref<string[]>(ASSETS.CHARACTERS.map(char => char.name));
const gameEngine = ref<GameEngine | null>(null);

// DataStar signals (reactive state from store)
const peers = computed(() => gameState.players);
const isConnected = computed(() => gameState.isConnected);
const activePeersCount = computed(() => activePlayers.value);

// Component refs
const gameHUD = ref<InstanceType<typeof GameHUD>>();
const settingsPanel = ref<InstanceType<typeof SettingsPanel>>();
const inventoryPanel = ref<InstanceType<typeof InventoryPanel>>();

// HUD and settings state
const hudPosition = ref(CONFIG.HUD.POSITION);
const hudSettings = reactive({
  showCoordinates: CONFIG.HUD.SHOW_COORDINATES,
  showTime: CONFIG.HUD.SHOW_TIME,
  showFPS: CONFIG.HUD.SHOW_FPS,
  showState: CONFIG.HUD.SHOW_STATE,
  showBoost: CONFIG.HUD.SHOW_BOOST_STATUS,
  showCredits: CONFIG.HUD.SHOW_CREDITS
});

const inventoryItems = ref([...CONFIG.INVENTORY.TILES]);

// Computed properties

// Initialize DataStar client
// Initialize DataStar signals connection
const initDataStar = (): void => {
  // DataStar connection is now handled automatically in state.ts
};

// Initialize game engine
const initGameEngine = (): void => {
  if (!gameCanvas.value) {
    return;
  }

  try {
    gameEngine.value = new GameEngine(gameCanvas.value, selectedEnvironment.value);
    gameEngine.value.onPeerUpdate = (peer: Peer) => {
      // Send peer update to server via DataStar signals
      if (isConnected.value) {
        fetch('/api/datastar/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'peer-update',
            peer: peer,
            environment: selectedEnvironment.value
          })
        }).catch(() => {
          // Error sending DataStar message
        });
      }

      // Update timestamp for testing
      const windowObj = window;
      windowObj.lastPeerUpdate = Date.now();
    };
  } catch {
    // Game engine initialization failed
  }
};

// Environment change handler
const onEnvironmentChange = (environment: string): void => {
  selectedEnvironment.value = environment;
  
  // Update game engine environment
  if (gameEngine.value) {
    gameEngine.value.setEnvironment(environment);
  }
  
  // Peers are streamed via DataStar signals
};

// Peers are now handled via DataStar signals

// Join game
const joinGame = async (): Promise<void> => {
  if (!gameEngine.value) return;
  
  try {
    const playerName = `Player_${Math.random().toString(36).substr(2, 9)}`;
    const playerPeer = gameEngine.value.createPlayer(playerName);
    if (playerPeer === null || playerPeer === undefined) {
      throw new Error('Failed to create player');
    }
    
    const response = await fetch(`${config.apiBaseUrl}/api/peers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playerPeer)
    });
    
    if (response.ok) {
      // Successfully joined game
    }
  } catch {
    // Failed to join game
  }
};

// Leave game
const leaveGame = (): void => {
  if (gameEngine.value) {
    try {
      gameEngine.value.removePlayer();
    } catch (error) {
      // Error removing player - handled silently
    }
  }
};


// Event handlers for components
const onCharacterChange = (character: string) => {
  selectedCharacter.value = character;
  // Character changed
  // Update game engine character if needed
};

const onHUDSettingsChange = (settings: typeof hudSettings) => {
  Object.assign(hudSettings, settings);
  // HUD settings changed
};

const onHUDPositionChange = (position: string) => {
  hudPosition.value = position;
  // HUD position changed
};

const onAudioSettingsChange = () => {
  // Audio settings changed
  // Update audio system if needed
};

const onSettingsSave = () => {
  // Settings saved
  // Save to localStorage or send to server
};

const onSettingsReset = () => {
  // Settings reset to defaults
  // Reset all settings to config defaults
};

const onItemUse = () => {
  // Item used
  // Handle item usage logic
};

const onItemDrop = () => {
  // Item dropped
  // Handle item drop logic
};

const onInventorySort = () => {
  // Inventory sorted
  // Handle inventory sorting
};

const onInventoryClear = () => {
  // Inventory cleared
  inventoryItems.value = [];
};

const onItemSelect = () => {
  // Item selected
  // Handle item selection
};

// Expose variables for testing
const exposeToWindow = () => {
  const windowObj = window;
  windowObj.gameEngine = gameEngine.value;
  windowObj.isConnected = isConnected.value;
  windowObj.peers = peers.value;
  windowObj.selectedEnvironment = selectedEnvironment.value;
  windowObj.pushNotificationClient = pushNotificationClient;
  (window).lastPeerUpdate = Date.now();
};

// Watch for changes and expose to window
watch([isConnected, peers, selectedEnvironment], () => {
  exposeToWindow();
}, { deep: true });

// Lifecycle hooks
onMounted(async () => {
  logClientConfig();
  initDataStar();
  initGameEngine();
  exposeToWindow();
  
  // Initialize PWA
  await pwaManager.registerServiceWorker();
  await pwaManager.requestNotificationPermission();
  
  // Initialize push notifications
  await pushNotificationClient.initialize();
});

onUnmounted(() => {
  if (gameEngine.value) {
    gameEngine.value.dispose();
  }
});
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #000;
}

#game-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>