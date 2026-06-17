import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Dummy Firebase config so the SDK initializes in tests (no network calls
    // are made; this only prevents getAuth() from throwing on an empty key).
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_APP_ID: '1:1:web:test',
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Component tests opt into jsdom via the `.dom.test.tsx` naming convention.
    environmentMatchGlobs: [['src/**/*.dom.{test,spec}.{ts,tsx}', 'jsdom']],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/store/**'],
    },
  },
});
