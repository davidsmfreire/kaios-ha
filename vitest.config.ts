import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __DEV__: 'false', __HA_DEV_PROXY__: '""' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
