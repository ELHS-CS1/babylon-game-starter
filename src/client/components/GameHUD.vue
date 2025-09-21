<template>
  <v-card
    v-if="showHUD"
    :class="hudPositionClass"
    color="grey-darken-4"
    elevation="8"
    rounded="lg"
    class="ma-2"
  >
    <v-card-text class="pa-2">
      <v-row no-gutters>
        <!-- Coordinates -->
        <v-col v-if="showCoordinates" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              Coordinates:
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 font-weight-bold">
              {{ coordinates }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- Time -->
        <v-col v-if="showTime" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              Time:
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 font-weight-bold">
              {{ gameTime }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- FPS -->
        <v-col v-if="showFPS" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              FPS:
            </v-list-item-title>
            <v-list-item-subtitle 
              class="text-body-2 font-weight-bold"
              :class="fps < 30 ? 'text-red-lighten-2' : 'text-white'"
            >
              {{ fps }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- State -->
        <v-col v-if="showState" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              State:
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-chip size="small" :color="stateColor" variant="outlined">
                {{ characterState }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- Boost Status -->
        <v-col v-if="showBoost" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              Boost:
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-chip size="small" :color="boostColor" variant="outlined">
                {{ boostStatus }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- Credits -->
        <v-col v-if="showCredits" cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              Credits:
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 font-weight-bold">
              {{ credits }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
        
        <!-- Peers -->
        <v-col cols="12" sm="6" md="4">
          <v-list-item class="px-0">
            <v-list-item-title class="text-caption text-grey-lighten-1">
              Players:
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 font-weight-bold">
              <v-chip size="small" color="success" variant="outlined">
                {{ activePeers }} online
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
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
const hudPositionClass = computed(() => {
  const positionMap = {
    top: 'fixed-top',
    bottom: 'fixed-bottom', 
    left: 'fixed-left',
    right: 'fixed-right'
  };
  return positionMap[props.position] || 'fixed-top';
});

// Get visibility settings based on device type
// const visibilitySettings = computed(() => {
//   const isMobileDevice = isMobile();
//   return isMobileDevice ? CONFIG.HUD.MOBILE : CONFIG.HUD;
// });

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
.game-hud {
  position: fixed;
  z-index: 1000;
  background: rgba(15, 15, 15, 0.95) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(45, 45, 45, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: 300px;
  max-width: 600px;
}

.hud-top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.hud-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.hud-left {
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
}

.hud-right {
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
}

.hud-element {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.hud-label {
  color: v-bind('CONFIG.HUD.SECONDARY_COLOR');
  font-size: 0.875rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.hud-value {
  color: v-bind('CONFIG.HUD.PRIMARY_COLOR');
  font-size: 0.875rem;
  font-weight: 600;
  font-family: v-bind('CONFIG.HUD.FONT_FAMILY');
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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
  .game-hud {
    min-width: 250px;
    max-width: 90vw;
  }
  
  .hud-element {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .hud-label,
  .hud-value {
    font-size: 0.75rem;
  }
}
</style>
