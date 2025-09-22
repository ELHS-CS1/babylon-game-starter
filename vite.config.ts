import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue()
  ],
  server: {
    port: 3000,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    sourcemap: false,
    outDir: 'dist/client',
    minify: 'esbuild',
    cssMinify: true,
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
    include: ['@babylonjs/havok']
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
