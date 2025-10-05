<template>
  <div v-if="showHUD" class="hud-container" :class="hudPositionClass">
    <!-- Coordinates -->
    <div v-if="showCoordinates" id="hud-coordinates" class="hud-element">
      <div class="hud-label">Position</div>
      <div id="hud-coordinates-value" class="hud-value">{{ coordinates }}</div>
    </div>
    
    <!-- Game Time -->
    <div v-if="showTime" id="hud-time" class="hud-element">
      <span class="hud-label">Time:</span>
      <br>
      <span id="hud-time-value" class="hud-value">{{ gameTime }}</span>
    </div>
    
    <!-- FPS -->
    <div v-if="showFPS" id="hud-fps" class="hud-element">
      <span class="hud-label">FPS:</span>
      <br>
      <span id="hud-fps-value" class="hud-value" :class="{ 'fps-warning': fps < 30 }">{{ fps }}</span>
    </div>
    
    <!-- Character State -->
    <div v-if="showState" id="hud-state" class="hud-element">
      <span class="hud-label">State:</span>
      <br>
      <span id="hud-state-value" class="hud-value" :color="stateColor">{{ characterState }}</span>
    </div>
    
    <!-- Boost Status -->
    <div v-if="showBoost" id="hud-boost" class="hud-element">
      <span class="hud-label">Boost:</span>
      <br>
      <span id="hud-boost-value" class="hud-value" :class="boostVuetifyClass">{{ boostStatus }}</span>
    </div>
    
    <!-- Credits -->
    <div v-if="showCredits" id="hud-credits" class="hud-element">
      <span class="hud-label">Credits:</span>
      <br>
      <span id="hud-credits-value" class="hud-value text-blue">{{ reactiveCredits }}</span>
    </div>
    
    <!-- Active Peers -->
    <div v-if="activePeers >= 0" id="hud-peers" class="hud-element">
      <span class="hud-label">Players:</span>
      <br>
      <span id="hud-peers-value" class="hud-value" :class="{ 'text-green': activePeers > 0, 'text-orange': activePeers === 0 }">{{ activePeers }}</span>
    </div>
    
    <!-- Connection Status -->
    <div v-if="showConnection" id="hud-connection" class="hud-element">
      <span class="hud-label">Connection:</span>
      <br>
      <span id="hud-connection-value" class="hud-value" :class="{ 'text-green': isConnected, 'text-red': !isConnected }">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import CONFIG from '../config/gameConfig';
import { HUDEventSystem, HUDEvents, type HUDEvent } from '../utils/hudEventSystem';

// Props
interface Props {
  position?: 'top' | 'bottom' | 'left' | 'right';
  showCoordinates?: boolean;
  showTime?: boolean;
  showFPS?: boolean;
  showState?: boolean;
  showBoost?: boolean;
  showCredits?: boolean;
  showConnection?: boolean;
  peers?: Array<{ id: string; name: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; environment: string; lastUpdate: number }>;
  activePeers?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => CONFIG.HUD.POSITION,
  showCoordinates: () => CONFIG.HUD.SHOW_COORDINATES,
  showTime: () => CONFIG.HUD.SHOW_TIME,
  showFPS: () => CONFIG.HUD.SHOW_FPS,
  showState: () => CONFIG.HUD.SHOW_STATE,
  showBoost: () => CONFIG.HUD.SHOW_BOOST_STATUS,
  showCredits: () => CONFIG.HUD.SHOW_CREDITS,
  showConnection: () => true,
  peers: () => [],
  activePeers: () => 0
});

// Reactive state
const showHUD = ref(true);
const coordinates = ref('0.0, 0.0, 0.0');
const gameTime = ref('00:00:00');
const fps = ref(60);
const characterState = ref('Idle');
const boostStatus = ref('Ready');

// Reactive credits from CollectiblesManager - THE WORD OF THE LORD!
const reactiveCredits = ref(0);

// Import game state for connection status
import { gameState } from '../state';
const isConnected = computed(() => gameState.isConnected);

// Computed properties
const hudPositionClass = computed(() => {
  const positionMap = {
    top: 'hud-top',
    bottom: 'hud-bottom',
    left: 'hud-left',
    right: 'hud-right'
  };
  return positionMap[props.position] || 'hud-top';
});

const stateColor = computed(() => {
  switch (characterState.value.toLowerCase()) {
    case 'idle': return 'grey';
    case 'walking': return 'blue';
    case 'running': return 'green';
    case 'jumping': return 'orange';
    case 'falling': return 'red';
    default: return 'grey';
  }
});

const boostVuetifyClass = computed(() => {
  switch (boostStatus.value) {
    case 'ACTIVE': return 'text-green';
    case 'Inactive': return 'text-red';
    case 'ready': return 'text-green';
    case 'cooldown': return 'text-red';
    default: return 'text-grey';
  }
});

// Event handlers for HUD updates - THE WORD OF THE LORD!
const handleCoordinatesEvent = (event: HUDEvent) => {
  if (event.type === 'hud:coordinates') {
    coordinates.value = `${event.data.x.toFixed(1)}, ${event.data.y.toFixed(1)}, ${event.data.z.toFixed(1)}`;
  }
};

const handleTimeEvent = (event: HUDEvent) => {
  if (event.type === 'hud:time') {
    gameTime.value = event.data.time;
  }
};

const handleFPSEvent = (event: HUDEvent) => {
  if (event.type === 'hud:fps') {
    fps.value = Math.round(event.data.fps);
  }
};

const handleStateEvent = (event: HUDEvent) => {
  if (event.type === 'hud:state') {
    characterState.value = event.data.state;
  }
};

const handleBoostEvent = (event: HUDEvent) => {
  if (event.type === 'hud:boost') {
    boostStatus.value = event.data.status;
  }
};

const handleCreditsEvent = (event: HUDEvent) => {
  if (event.type === 'hud:credits') {
    reactiveCredits.value = event.data.credits;
  }
};

const handlePeersEvent = (event: HUDEvent) => {
  if (event.type === 'hud:peers') {
    // Update activePeers through props or emit to parent
    // For now, we'll handle this through the existing props system
  }
};

// Legacy update functions for backward compatibility
const updateCoordinates = (x: number, y: number, z: number) => {
  HUDEvents.coordinates(x, y, z);
};

const updateTime = () => {
  const now = new Date();
  HUDEvents.time(now.toLocaleTimeString());
};

const updateFPS = (currentFPS: number) => {
  HUDEvents.fps(currentFPS);
};

const updateState = (state: string) => {
  HUDEvents.state(state);
};

const updateBoost = (status: string) => {
  HUDEvents.boost(status);
};

const updateCredits = (amount: number) => {
  HUDEvents.credits(amount);
};

// Expose methods for parent component
defineExpose({
  updateCoordinates,
  updateTime,
  updateFPS,
  updateState,
  updateBoost,
  updateCredits,
  toggleHUD: () => { showHUD.value = !showHUD.value; }
});

// Listen for config updates
watch(() => CONFIG.HUD, () => {
  // Update HUD when config changes
}, { deep: true });

// Event subscription cleanup functions
let unsubscribeFunctions: (() => void)[] = [];

onMounted(() => {
  // Subscribe to HUD events - THE WORD OF THE LORD!
  unsubscribeFunctions.push(
    HUDEventSystem.subscribe('hud:coordinates', handleCoordinatesEvent),
    HUDEventSystem.subscribe('hud:time', handleTimeEvent),
    HUDEventSystem.subscribe('hud:fps', handleFPSEvent),
    HUDEventSystem.subscribe('hud:state', handleStateEvent),
    HUDEventSystem.subscribe('hud:boost', handleBoostEvent),
    HUDEventSystem.subscribe('hud:credits', handleCreditsEvent),
    HUDEventSystem.subscribe('hud:peers', handlePeersEvent)
  );

  // Listen for HUD config updates
  window.addEventListener('hud-config-updated', () => {
    // HUD config updated via event
  });
});

onUnmounted(() => {
  // Unsubscribe from all HUD events
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  unsubscribeFunctions = [];

  // Remove event listeners
  window.removeEventListener('hud-config-updated', () => {});
});
</script>

<style scoped>
/* HUD Container - matches playground.ts positioning */
.hud-container {
  position: absolute;
  display: flex;
  padding: 15px;
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  pointer-events: none;
}

/* Position-specific container styles */
.hud-top {
  top: 0;
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
}

.hud-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
}

.hud-left {
  top: 0;
  left: 0;
  bottom: 0;
  flex-direction: column;
  justify-content: flex-start;
}

.hud-right {
  top: 0;
  right: 0;
  bottom: 0;
  flex-direction: column;
  justify-content: flex-start;
}

/* Individual HUD Elements - matches playground.ts styling */
.hud-element {
  background-color: #000000;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 8px 12px;
  margin: 2px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-width: 80px;
  text-align: center;
  transition: all 0.2s ease;
}

.hud-label {
  color: #cccccc;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.hud-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Special styling for coordinates to prevent wrapping */
#hud-coordinates .hud-value {
  white-space: nowrap;
  min-width: 180px;
  display: inline-block;
}

#hud-coordinates .hud-label {
  margin-right: 8px;
}

.fps-warning {
  color: #ff6b6b !important;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}


/* Mobile responsiveness */
@media (max-width: 768px) {
  .hud-container {
    padding: 10px;
    font-size: 12px;
  }
  
  .hud-element {
    min-width: 60px;
    padding: 6px 8px;
  }
  
  .hud-label,
  .hud-value {
    font-size: 11px;
  }
  
  #hud-coordinates .hud-value {
    min-width: 120px;
  }
}
</style>