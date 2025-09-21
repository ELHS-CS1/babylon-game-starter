<template>
  <div v-if="showHUD" :class="['hud-container', `hud-${position}`]">
    <!-- Coordinates -->
    <div v-if="showCoordinates" class="hud-element" id="hud-coordinates">
      <span class="hud-label">Position:</span>
      <span class="hud-value" id="hud-coordinates-value">{{ coordinates }}</span>
    </div>
    
    <!-- Game Time -->
    <div v-if="showTime" class="hud-element" id="hud-time">
      <span class="hud-label">Time:</span>
      <br>
      <span class="hud-value" id="hud-time-value">{{ gameTime }}</span>
    </div>
    
    <!-- FPS -->
    <div v-if="showFPS" class="hud-element" id="hud-fps">
      <span class="hud-label">FPS:</span>
      <br>
      <span class="hud-value" id="hud-fps-value" :class="{ 'fps-warning': fps < 30 }">{{ fps }}</span>
    </div>
    
    <!-- Character State -->
    <div v-if="showState" class="hud-element" id="hud-state">
      <span class="hud-label">State:</span>
      <br>
      <span class="hud-value" id="hud-state-value" :color="stateColor">{{ characterState }}</span>
    </div>
    
    <!-- Boost Status -->
    <div v-if="showBoost" class="hud-element" id="hud-boost">
      <span class="hud-label">Boost:</span>
      <br>
      <span class="hud-value" id="hud-boost-value" :color="boostColor">{{ boostStatus }}</span>
    </div>
    
    <!-- Credits -->
    <div v-if="showCredits" class="hud-element" id="hud-credits">
      <span class="hud-label">Credits:</span>
      <br>
      <span class="hud-value" id="hud-credits-value">{{ credits }}</span>
    </div>
    
    <!-- Active Peers -->
    <div v-if="activePeers > 0" class="hud-element" id="hud-peers">
      <span class="hud-label">Players:</span>
      <br>
      <span class="hud-value" id="hud-peers-value">{{ activePeers }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import CONFIG from '../config/gameConfig';

// Props
interface Props {
  position?: 'top' | 'bottom' | 'left' | 'right';
  showCoordinates?: boolean;
  showTime?: boolean;
  showFPS?: boolean;
  showState?: boolean;
  showBoost?: boolean;
  showCredits?: boolean;
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
const credits = ref('0');

// Computed properties
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

const boostColor = computed(() => {
  switch (boostStatus.value.toLowerCase()) {
    case 'ready': return 'green';
    case 'active': return 'orange';
    case 'cooldown': return 'red';
    default: return 'grey';
  }
});

// Update functions
const updateCoordinates = (x: number, y: number, z: number) => {
  coordinates.value = `${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`;
};

const updateTime = () => {
  const now = new Date();
  gameTime.value = now.toLocaleTimeString();
};

const updateFPS = (currentFPS: number) => {
  fps.value = Math.round(currentFPS);
};

const updateState = (state: string) => {
  characterState.value = state;
};

const updateBoost = (status: string) => {
  boostStatus.value = status;
};

const updateCredits = (amount: number) => {
  credits.value = amount.toString();
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

// Update loop
let updateInterval: number | null = null;

// Listen for config updates
watch(() => CONFIG.HUD, () => {
  // Update HUD when config changes
}, { deep: true });

onMounted(() => {
  // Start update loop using config interval
  updateInterval = window.setInterval(() => {
    updateTime();
  }, CONFIG.HUD.UPDATE_INTERVAL);
  
  // Listen for HUD config updates
  window.addEventListener('hud-config-updated', () => {
    // HUD config updated via event
  });
});

onUnmounted(() => {
  if (updateInterval !== null) {
    clearInterval(updateInterval);
  }
  
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