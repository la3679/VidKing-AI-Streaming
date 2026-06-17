import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // jsdom is opted into per-file for component tests via:
    //   // @vitest-environment jsdom
    environmentMatchGlobs: [['src/**/*.dom.{test,spec}.{ts,tsx}', 'jsdom']],
  },
});
