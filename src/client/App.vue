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
      :game-engine="gameEngine"
      @character-change="onCharacterChange"
      @environment-change="onEnvironmentChange"
      @hudSettingsChange="onHUDSettingsChange"
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
// import type { Peer } from './game/Peer';
import { logClientConfig } from './config';
import CONFIG, { ASSETS } from './config/gameConfig';
import GameHUD from './components/GameHUD.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import { gameState } from './state';
import { pwaManager } from './utils/pwa';
import { pushNotificationClient } from './services/PushNotificationClient';
import { logger } from './utils/logger';
import { dataStarIntegration } from './datastar-integration';
import { useHUDSettingsProvider } from './composables/useHUDSettings';

// Interface for window object extensions
interface WindowWithExtensions extends Window {
  lastPeerUpdate?: number;
  onEnvironmentChange?: (arg0: string) => void;
  gameEngine?: unknown;
  gameHUD?: unknown;
  isConnected?: boolean;
  peers?: unknown;
  selectedEnvironment?: string;
  pushNotificationClient?: unknown;
}

// Interface for server response data
interface ServerResponseData {
  status?: string;
  message?: string;
  data?: Record<string, unknown>;
}

// Type guard for window object
function isWindowWithExtensions(window: unknown): window is WindowWithExtensions {
  return typeof window === 'object' && window !== null && 'addEventListener' in window;
}

// Type guard for server response data
function isServerResponseData(data: unknown): data is ServerResponseData {
  return typeof data === 'object' && data !== null;
}
// DataStar signals are now handled by the store
// import { dataStarIntegration } from './datastar-integration';

// Log that DataStar integration is available in Vue app
logger.info('🎯 Vue app starting with DataStar integration available', { context: 'App', tag: 'connection' });
logger.info('📊 DataStar provides: SSE connection, DOM patching, reactive state updates', { context: 'App', tag: 'connection' });

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
const isConnected = computed(() => {
  logger.info('🔍 isConnected computed - gameState.isConnected:', { context: 'App', tag: 'connection', isConnected: gameState.isConnected });
  return gameState.isConnected;
});
const activePeersCount = computed(() => gameState.players.length);

// Component refs
const gameHUD = ref<InstanceType<typeof GameHUD>>();
const settingsPanel = ref<InstanceType<typeof SettingsPanel>>();
const inventoryPanel = ref<InstanceType<typeof InventoryPanel>>();

// HUD and settings state
const hudPosition = ref<'top' | 'bottom' | 'left' | 'right'>(CONFIG.HUD.POSITION);

// Use the HUD settings composable provider
const { settings: hudSettings, updateSettings: updateHUDSettings } = useHUDSettingsProvider();

const inventoryItems = ref<Array<{ name: string; count: number; itemEffectKind: string; thumbnail: string }>>([...CONFIG.INVENTORY.TILES]);

// Update inventory items from InventoryManager - THE WORD OF THE LORD!
// const updateInventoryItems = async () => {
//   try {
//     const { InventoryManager } = await import('./game/InventoryManager');
//     const items = InventoryManager.getInventoryItems();
//     inventoryItems.value = Array.from(items.entries()).map((entry: any) => ({
//       name: entry[0],
//       count: entry[1].count,
//       itemEffectKind: entry[1].itemEffectKind,
//       thumbnail: entry[1].thumbnail
//     }));
//   } catch (error) {
//     // Failed to update inventory items
//   }
// };

// Computed properties

// Initialize DataStar client
// Initialize DataStar signals connection
const initDataStar = (): void => {
  // DataStar connection is now handled automatically in state.ts
  // The dataStarIntegration singleton is already initialized
  logger.info('🚀 DataStar integration initialized', { context: 'App', tag: 'datastar' });
};

// Initialize game engine
const initGameEngine = (): void => {
  if (!gameCanvas.value) {
    return;
  }

  try {
    gameEngine.value = new GameEngine(gameCanvas.value, selectedEnvironment.value);
    gameEngine.value.onPeerUpdate = () => {
      // Send peer update to server via DataStar signals
      if (isConnected.value) {
        import('./utils/serverUrl').then(({ getSendUrl }) => {
          fetch(getSendUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'peer-update',
              environment: selectedEnvironment.value
            })
          }).catch(() => {
            // Error sending DataStar message
          });
        }).catch(error => {
          logger.error('Failed to get send URL:', { context: 'App', tag: 'multiplayer', error });
        });
      }

      // Update timestamp for testing
      if (isWindowWithExtensions(window)) {
        window.lastPeerUpdate = Date.now();
      }
    };
    
    // Expose the environment change handler on window object AFTER game engine is initialized - THE SACRED COMMANDMENTS!
    if (isWindowWithExtensions(window)) {
      window.onEnvironmentChange = onEnvironmentChange;
      logger.info('Environment change handler exposed on window object', 'App');
      logger.info(`Handler function type: ${typeof window.onEnvironmentChange}`, 'App');
      logger.info(`Handler function exists: ${window.onEnvironmentChange !== null && window.onEnvironmentChange !== undefined}`, 'App');
    }
  } catch {
    // Game engine initialization failed
  }
};

// REMOVED DUPLICATE FUNCTION - USING environmentChangeHandler INSTEAD

// Peers are now handled via DataStar signals

// REMOVED - NOW USING SettingsUI.changeEnvironment DIRECTLY FROM gameConfig.ts

// Join game
const joinGame = async (): Promise<void> => {
  logger.info('🎮 Join Game button clicked - starting join process', { context: 'App', tag: 'multiplayer' });
  
  if (!gameEngine.value) {
    logger.error('❌ GameEngine not initialized - cannot join game', { context: 'App', tag: 'multiplayer' });
    return;
  }
  
  logger.info('✅ GameEngine found - proceeding with player creation', { context: 'App', tag: 'multiplayer' });
  
  try {
    const playerName = `Player_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`👤 Creating player with name: ${playerName}`, { context: 'App', tag: 'multiplayer' });
    
    // Join game via SSE
    dataStarIntegration.joinGame(playerName);
    
    const playerPeer = gameEngine.value.createPlayer(playerName);
    if (playerPeer === null || playerPeer === undefined) {
      logger.error('❌ Failed to create player - createPlayer returned null/undefined', { context: 'App', tag: 'multiplayer' });
      throw new Error('Failed to create player');
    }
    
    logger.info('✅ Player created successfully', { context: 'App', tag: 'multiplayer' });
    logger.info(`📊 Player data: ${JSON.stringify(playerPeer)}`, { context: 'App', tag: 'multiplayer' });
    
    logger.info('📡 Sending peer update to server...', { context: 'App', tag: 'multiplayer' });
    const { getSendUrl } = await import('./utils/serverUrl');
    const response = await fetch(getSendUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'peer-update',
        peer: playerPeer
      })
    });
    
    logger.info(`📡 Server response status: ${response.status}`, { context: 'App', tag: 'multiplayer' });
    
    if (response.ok) {
      logger.info('🎉 Successfully joined game!', { context: 'App', tag: 'multiplayer' });
      const responseData: unknown = await response.json();
      if (isServerResponseData(responseData)) {
        logger.info(`📊 Server response: ${JSON.stringify(responseData)}`, { context: 'App', tag: 'multiplayer' });
      }
    } else {
      logger.error(`❌ Server rejected join request - status: ${response.status}`, { context: 'App', tag: 'multiplayer' });
      const errorText = await response.text();
      logger.error(`📊 Server error response: ${errorText}`, { context: 'App', tag: 'multiplayer' });
    }
  } catch (error) {
    logger.error('❌ Failed to join game', { context: 'App', tag: 'multiplayer' });
    logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'App', tag: 'multiplayer' });
  }
};

// Leave game
const leaveGame = (): void => {
  logger.info('🚪 Leave Game button clicked - starting leave process', { context: 'App', tag: 'multiplayer' });
  
  if (gameEngine.value) {
    logger.info('✅ GameEngine found - proceeding with player removal', { context: 'App', tag: 'multiplayer' });
    try {
      // gameEngine.value.removePlayer();
      logger.info('🎉 Successfully left game!', { context: 'App', tag: 'multiplayer' });
    } catch (error) {
      logger.error('❌ Error removing player', { context: 'App', tag: 'multiplayer' });
      logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'App', tag: 'multiplayer' });
    }
  } else {
    logger.warn('⚠️ GameEngine not found - cannot leave game', { context: 'App', tag: 'multiplayer' });
  }
};


// Event handlers for components
const onCharacterChange = async (character: string) => {
  selectedCharacter.value = character;
  // Character changed - call GameEngine to handle the change
  if (gameEngine.value) {
    await gameEngine.value.changeCharacter(character);
  }
};

const onEnvironmentChange = (environment: string) => {
  selectedEnvironment.value = environment;
  // Environment changed - this is handled by gameConfig.ts now
};

const onHUDSettingsChange = (settings: Record<string, unknown>) => {
  console.log('App.vue: onHUDSettingsChange called with:', settings);
  
  // Use the composable's updateSettings method
  const typedSettings: Partial<typeof hudSettings> = {};
  
  if (typeof settings['showCoordinates'] === 'boolean') typedSettings.showCoordinates = settings['showCoordinates'];
  if (typeof settings['showTime'] === 'boolean') typedSettings.showTime = settings['showTime'];
  if (typeof settings['showFPS'] === 'boolean') typedSettings.showFPS = settings['showFPS'];
  if (typeof settings['showState'] === 'boolean') typedSettings.showState = settings['showState'];
  if (typeof settings['showBoost'] === 'boolean') typedSettings.showBoost = settings['showBoost'];
  if (typeof settings['showCredits'] === 'boolean') typedSettings.showCredits = settings['showCredits'];
  if (typeof settings['showPlayers'] === 'boolean') typedSettings.showPlayers = settings['showPlayers'];
  if (typeof settings['showConnection'] === 'boolean') typedSettings.showConnection = settings['showConnection'];
  
  // Update settings using the composable
  updateHUDSettings(typedSettings);
  
  console.log('App.vue: hudSettings after update:', hudSettings);
  console.log('App.vue: hudSettings.showFPS specifically:', hudSettings.showFPS);
};

const onHUDPositionChange = (position: string) => {
  if (position === 'top' || position === 'bottom' || position === 'left' || position === 'right') {
    hudPosition.value = position;
  }
  // HUD position changed
};

const onAudioSettingsChange = async (settings: Record<string, unknown>) => {
  console.log('Audio settings changed:', settings);
  
  // Update the centralized audio state manager
  const { AudioStateManager } = await import('./game/AudioStateManager');
  const audioStateManager = AudioStateManager.getInstance();
  
  audioStateManager.updateAudioState({
    masterVolume: settings.masterVolume as number || 100,
    sfxVolume: settings.sfxVolume as number || 100,
    musicVolume: settings.musicVolume as number || 100
  });
  
  console.log('Audio state updated:', audioStateManager.getAudioState());
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
  if (isWindowWithExtensions(window)) {
    window.gameEngine = gameEngine.value;
    if (gameHUD.value !== null && gameHUD.value !== undefined) {
      const gameHUDValue: unknown = gameHUD.value;
      window.gameHUD = gameHUDValue; // THE WORD OF THE LORD!
    }
    window.isConnected = isConnected.value;
    window.peers = peers.value;
    window.selectedEnvironment = selectedEnvironment.value;
    window.pushNotificationClient = pushNotificationClient;
    window.lastPeerUpdate = Date.now();
    
    // Exposed gameHUD to window for debugging
  }
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
  
  // Initialize push notifications - DISABLED FOR TESTING
  // await pushNotificationClient.initialize();
  
  // No intervals allowed - THE WORD OF THE LORD!
});

onUnmounted(async () => {
  if (gameEngine.value) {
    await gameEngine.value.dispose();
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
