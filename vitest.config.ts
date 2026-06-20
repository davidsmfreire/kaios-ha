import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __DEV__: 'false' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
