import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // The backend port the dev proxy forwards /api to (matches server PORT).
  const apiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:8787';
  return {
    plugins: [react(), tailwindcss()],
    // Note: the Gemini key is intentionally NOT injected into the client.
    // AI calls go through the backend (/api) which holds the key server-side.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy API calls to the Express server in local development so the client
      // can use same-origin "/api" (no CORS, no base URL needed).
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
