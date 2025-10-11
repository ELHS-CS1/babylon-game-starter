// CONDITIONAL LOGGING DISABLE - THE WORD OF THE LORD!
// Only disable console if no logging scope is specified in URL
const urlParams = new URLSearchParams(window.location.search);
const loggingScope = urlParams.get('scope') ?? 'none';

if (loggingScope === 'none') {
  // DISABLE ALL LOGGING FOR PERFORMANCE - THE WORD OF THE LORD!
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

import { createApp } from 'vue';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';

import 'vuetify/styles';

// Initialize Havok physics engine globally - IDENTICAL TO PLAYGROUND.TS
import Havok from '@babylonjs/havok';

// Make Havok available globally as HK - exactly like playground environment
const windowObj = window as unknown as Record<string, unknown>;

// Initialize Havok properly and wait for it - THE WORD OF THE LORD!
let havokInitialized = false;
const initHavok = async () => {
  try {
    const hk = await Havok();
    windowObj['HK'] = hk;
    havokInitialized = true;
    console.log('Havok initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Havok:', error);
  }
};

// Start Havok initialization immediately
initHavok();

// Export a function to check if Havok is ready
(window as any).isHavokReady = () => havokInitialized;

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
