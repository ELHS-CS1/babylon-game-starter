<template>
  <!-- Inventory Toggle Button -->
  <v-btn
    class="inventory-toggle-btn"
    size="large"
    color="amber"
    variant="elevated"
    @click="togglePanel"
  >
    <v-icon>mdi-package</v-icon>
    <v-badge
      v-if="totalItems > 0"
      :content="totalItems.toString()"
      color="red"
      floating
    />
  </v-btn>

  <!-- Inventory Panel -->
  <v-navigation-drawer
    v-model="isOpen"
    temporary
    location="right"
    :width="panelWidth"
    class="inventory-panel"
    :z-index="CONFIG.INVENTORY.Z_INDEX"
  >
    <v-card class="h-100" color="grey-darken-4">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="amber-lighten-2" class="me-2">mdi-package-variant</v-icon>
          <span class="text-h6 font-weight-bold">{{ headingText }}</span>
          <v-chip
            v-if="totalItems > 0"
            size="small"
            color="amber-lighten-2"
            variant="outlined"
            class="ms-2"
          >
            {{ totalItems }} items
          </v-chip>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-lighten-1"
          @click="closePanel"
        />
      </v-card-title>

      <v-divider color="grey-darken-2" />

      <!-- Inventory Content -->
      <v-card-text class="pa-4 inventory-content">
        <!-- Empty State -->
        <div v-if="reactiveInventoryItems.length === 0" class="empty-state text-center py-8">
          <v-icon size="64" color="grey-darken-1" class="mb-4">mdi-package-variant-closed</v-icon>
          <h3 class="text-h6 text-grey-lighten-1 mb-2">Inventory Empty</h3>
          <p class="text-body-2 text-grey">Collect items in the game to see them here</p>
        </div>

        <!-- Inventory Grid -->
        <div v-else class="inventory-grid">
          <v-card
            v-for="item in reactiveInventoryItems"
            :key="item.id"
            class="inventory-item"
            :class="{ 'item-selected': selectedItem?.id === item.id }"
            elevation="4"
            @click="selectItem(item)"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center">
                <!-- Item Icon -->
                <v-avatar
                  size="48"
                  :color="getItemColor(item.type)"
                  class="me-3"
                >
                  <v-icon :color="getItemIconColor(item.type)" size="24">
                    {{ getItemIcon(item.type) }}
                  </v-icon>
                </v-avatar>

                <!-- Item Info -->
                <div class="flex-grow-1">
                  <h4 class="text-subtitle-1 font-weight-bold mb-1">
                    {{ item.name }}
                  </h4>
                  <p class="text-caption text-grey-lighten-1 mb-2">
                    {{ item.description }}
                  </p>
                  
                  <!-- Item Stats -->
                  <div class="d-flex align-center">
                    <v-chip
                      size="x-small"
                      :color="getItemRarityColor(item.rarity)"
                      variant="outlined"
                      class="me-2"
                    >
                      {{ item.rarity }}
                    </v-chip>
                    
                    <v-chip
                      v-if="item.quantity > 1"
                      size="x-small"
                      color="blue-lighten-2"
                      variant="outlined"
                    >
                      x{{ item.quantity }}
                    </v-chip>
                  </div>
                </div>

                <!-- Item Actions -->
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                      color="grey-lighten-1"
                      v-bind="props"
                    />
                  </template>
                  <v-list color="grey-darken-3" density="compact">
                    <v-list-item @click="useItem(item)">
                      <template v-slot:prepend>
                        <v-icon color="green-lighten-2">mdi-play</v-icon>
                      </template>
                      <v-list-item-title>Use</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="dropItem(item)">
                      <template v-slot:prepend>
                        <v-icon color="red-lighten-2">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>Drop</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <!-- Footer Actions -->
      <v-divider color="grey-darken-2" />
      <v-card-actions class="pa-4">
        <v-btn
          color="grey-lighten-1"
          variant="outlined"
          @click="sortInventory"
        >
          <v-icon left>mdi-sort</v-icon>
          Sort
        </v-btn>
        <v-spacer />
        <v-btn
          color="red-lighten-2"
          variant="outlined"
          :disabled="reactiveInventoryItems.length === 0"
          @click="clearInventory"
        >
          <v-icon left>mdi-delete-sweep</v-icon>
          Clear All
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { InventoryData } from '../game/InventoryData';
// import { ThemeUtils } from '../config/themeConfig'; // Unused for now
import CONFIG from '../config/gameConfig';
import { logger } from '../utils/logger';

// Types
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'jump' | 'invisibility' | 'health' | 'weapon' | 'collectible';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  effect?: string;
  value?: number;
}

// Props
interface Props {
  items?: InventoryItem[];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
});

// Emits
const emit = defineEmits<{
  'itemUse': [item: InventoryItem];
  'itemDrop': [item: InventoryItem];
  'inventorySort': [];
  'inventoryClear': [];
  'itemSelect': [item: InventoryItem | null];
}>();

// Reactive state
const isOpen = ref(false);
const inventoryItems = ref<InventoryItem[]>([...props.items]);
const selectedItem = ref<InventoryItem | null>(null);

// Reactive inventory items from InventoryManager - THE WORD OF THE LORD!
const reactiveInventoryItems = ref<InventoryItem[]>([]);

// Update inventory items from InventoryManager - THE WORD OF THE LORD!
const updateInventoryItems = async () => {
  try {
    const { InventoryManager } = await import('../game/InventoryManager');
    const items = InventoryManager.getInventoryItems();
    logger.info(`InventoryPanel: Updating inventory items ${items.size}`, { context: 'InventoryPanel', tag: 'inventory' });
    
    const newItems = Array.from(items.entries()).map((entry: any) => ({
      id: entry[0],
      name: entry[0],
      description: `${entry[1].itemEffectKind} item`,
      type: 'collectible' as const,
      rarity: 'common' as const,
      quantity: entry[1].count,
      effect: entry[1].itemEffectKind,
      value: 1
    }));
    
    reactiveInventoryItems.value = newItems;
    
    logger.info(`InventoryPanel: Updated inventory items ${reactiveInventoryItems.value.length}`, { context: 'InventoryPanel', tag: 'inventory' });
  } catch (error) {
    logger.error('InventoryPanel: Failed to update inventory items', { context: 'InventoryPanel', tag: 'inventory' });
  }
};

// Computed values based on config settings - THE WORD OF THE LORD
const panelWidth = computed(() => InventoryData.getPanelWidth());
const headingText = computed(() => InventoryData.getHeadingText());
// const dynamicInventoryItems = computed(() => InventoryData.getInventoryItemsArray()); // Unused for now

// Theme configuration - THE WORD OF THE LORD
// const themeColors = computed(() => ThemeUtils.getComponentTheme('inventory')); // Unused for now
// const vuetifyColors = computed(() => ThemeUtils.getVuetifyColors(themeColors.value)); // Unused for now

// Computed properties
const totalItems = computed(() => {
  return reactiveInventoryItems.value.reduce((total, item) => total + item.quantity, 0);
});

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

const selectItem = (item: InventoryItem) => {
  selectedItem.value = selectedItem.value?.id === item.id ? null : item;
  emit('itemSelect', selectedItem.value);
};

const useItem = async (item: InventoryItem) => {
  // Use the item through InventoryData - THE WORD OF THE LORD
  InventoryData.useItem(item.name);
  emit('itemUse', item);
  
  // Update inventory items from InventoryManager to sync with actual state
  await updateInventoryItems();
  
  // Trigger inventory update event to notify other components - THE WORD OF THE LORD!
  window.dispatchEvent(new CustomEvent('inventoryUpdated'));
  
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null;
  }
};

const dropItem = (item: InventoryItem) => {
  emit('itemDrop', item);
  
  // Remove item from inventory
  const index = inventoryItems.value.findIndex(i => i.id === item.id);
  if (index > -1) {
    inventoryItems.value.splice(index, 1);
  }
  
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null;
  }
};

const sortInventory = () => {
  inventoryItems.value.sort((a, b) => {
    // Sort by rarity first (legendary to common)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    
    // Then by name
    return a.name.localeCompare(b.name);
  });
  
  emit('inventorySort');
};

const clearInventory = () => {
  inventoryItems.value = [];
  selectedItem.value = null;
  emit('inventoryClear');
};

// Lifecycle hooks - THE WORD OF THE LORD!

onMounted(() => {
  logger.info('InventoryPanel: Component mounted', { context: 'InventoryPanel', tag: 'inventory' });
  // Call it immediately
  updateInventoryItems();
  
  // Listen for inventory updates - THE WORD OF THE LORD!
  window.addEventListener('inventoryUpdated', updateInventoryItems);
});

onUnmounted(() => {
  // Remove event listener - THE WORD OF THE LORD!
  window.removeEventListener('inventoryUpdated', updateInventoryItems);
});

// Item helper functions
const getItemIcon = (type: string): string => {
  const icons: Record<string, string> = {
    jump: 'mdi-rocket-launch',
    invisibility: 'mdi-eye-off',
    health: 'mdi-heart',
    weapon: 'mdi-sword',
    collectible: 'mdi-star'
  };
  return icons[type] ?? 'mdi-package-variant';
};

const getItemColor = (type: string): string => {
  const colors: Record<string, string> = {
    jump: 'blue-darken-3',
    invisibility: 'purple-darken-3',
    health: 'red-darken-3',
    weapon: 'orange-darken-3',
    collectible: 'amber-darken-3'
  };
  return colors[type] ?? 'grey-darken-3';
};

const getItemIconColor = (type: string): string => {
  const colors: Record<string, string> = {
    jump: 'blue-lighten-2',
    invisibility: 'purple-lighten-2',
    health: 'red-lighten-2',
    weapon: 'orange-lighten-2',
    collectible: 'amber-lighten-2'
  };
  return colors[type] ?? 'grey-lighten-2';
};

const getItemRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: 'grey-lighten-1',
    uncommon: 'green-lighten-2',
    rare: 'blue-lighten-2',
    epic: 'purple-lighten-2',
    legendary: 'amber-lighten-2'
  };
  return colors[rarity] ?? 'grey-lighten-1';
};

// Computed properties

// Expose methods
defineExpose({
  openPanel,
  closePanel,
  addItem: (item: InventoryItem) => {
    const existingItem = inventoryItems.value.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      inventoryItems.value.push({ ...item });
    }
  },
  removeItem: (itemId: string) => {
    const index = inventoryItems.value.findIndex(i => i.id === itemId);
    if (index > -1) {
      inventoryItems.value.splice(index, 1);
    }
  },
  isOpen: () => isOpen.value
});
</script>

<style scoped>
.inventory-toggle-btn {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: 2000 !important;
}

.inventory-content {
  padding-bottom: 100px !important; /* Extra space to avoid button overlap */
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
}
</style>

