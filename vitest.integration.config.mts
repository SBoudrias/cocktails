import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/app/**/page.test.{ts,tsx}'],
    setupFiles: ['./tools/test-setup.ts'],
    clearMocks: true,
    testTimeout: 10000, // 10 second timeout for integration tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  plugins: [tsconfigPaths(), react()],
});
