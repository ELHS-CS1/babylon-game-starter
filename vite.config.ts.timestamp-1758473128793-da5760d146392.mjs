// vite.config.ts
import { defineConfig } from "file:///Users/eeisaman/Documents/SIGMA%20PRODUCTIONS/Babylon-GameDev-1A/game-dev-1a/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/eeisaman/Documents/SIGMA%20PRODUCTIONS/Babylon-GameDev-1A/game-dev-1a/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/eeisaman/Documents/SIGMA PRODUCTIONS/Babylon-GameDev-1A/game-dev-1a";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [vue()],
  server: {
    port: 3e3,
    host: true
  },
  preview: {
    port: 3e3,
    host: true
  },
  build: {
    sourcemap: true,
    outDir: "dist/client"
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src/client"),
      "@server": resolve(__vite_injected_original_dirname, "src/server")
    }
  },
  test: {
    globals: true,
    environment: "jsdom"
  },
  define: {
    // Environment variables for client
    "import.meta.env.VITE_DOCKER": JSON.stringify(process.env.DOCKER === "true"),
    "import.meta.env.VITE_PROD": JSON.stringify(mode === "production")
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZWVpc2FtYW4vRG9jdW1lbnRzL1NJR01BIFBST0RVQ1RJT05TL0JhYnlsb24tR2FtZURldi0xQS9nYW1lLWRldi0xYVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2VlaXNhbWFuL0RvY3VtZW50cy9TSUdNQSBQUk9EVUNUSU9OUy9CYWJ5bG9uLUdhbWVEZXYtMUEvZ2FtZS1kZXYtMWEvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2VlaXNhbWFuL0RvY3VtZW50cy9TSUdNQSUyMFBST0RVQ1RJT05TL0JhYnlsb24tR2FtZURldi0xQS9nYW1lLWRldi0xYS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBwbHVnaW5zOiBbdnVlKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIGhvc3Q6IHRydWVcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZVxuICB9LFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBvdXREaXI6ICdkaXN0L2NsaWVudCdcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2NsaWVudCcpLFxuICAgICAgJ0BzZXJ2ZXInOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zZXJ2ZXInKVxuICAgIH1cbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbSdcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciBjbGllbnRcbiAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRE9DS0VSJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuRE9DS0VSID09PSAndHJ1ZScpLFxuICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9QUk9EJzogSlNPTi5zdHJpbmdpZnkobW9kZSA9PT0gJ3Byb2R1Y3Rpb24nKVxuICB9XG59KSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1osU0FBUyxvQkFBb0I7QUFDL2EsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUZ4QixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxFQUNmLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDcEMsV0FBVyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxJQUM1QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLCtCQUErQixLQUFLLFVBQVUsUUFBUSxJQUFJLFdBQVcsTUFBTTtBQUFBLElBQzNFLDZCQUE2QixLQUFLLFVBQVUsU0FBUyxZQUFZO0FBQUEsRUFDbkU7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
