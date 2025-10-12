import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue()
  ],
  logLevel: 'error', // DISABLE VITE LOGGING - THE WORD OF THE LORD!
  clearScreen: false, // Don't clear screen on rebuild
  server: {
    port: 3001,
    host: true,
    https: {
      key: readFileSync('./certs/localhost+2-key.pem'),
      cert: readFileSync('./certs/localhost+2.pem')
    },
    hmr: {
      port: 3002
    },
    headers: {}
  },
  preview: {
    port: 3001,
    host: true
  },
  build: {
    sourcemap: false,
    outDir: 'dist/client',
    minify: 'esbuild',
    cssMinify: true,
    esbuild: {
      // Strip out logger calls at build time for production - THE WORD OF THE LORD!
      pure: ['logger.info', 'logger.error', 'logger.warn', 'logger.assert', 'logger.debug', 'logger.trace', 'logger.fatal']
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue'],
          'vuetify-vendor': ['vuetify'],
          'babylon-vendor': ['@babylonjs/core', '@babylonjs/loaders'],
          'havok-vendor': ['@babylonjs/havok']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/client'),
      '@server': resolve(__dirname, 'src/server')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
  define: {
    // Environment variables for client
    'import.meta.env.VITE_DOCKER': JSON.stringify(process.env['DOCKER'] === 'true'),
    'import.meta.env.VITE_PROD': JSON.stringify(mode === 'production')
  }
}))
