import { fileURLToPath, URL } from 'node:url';
import { defineConfig, coverageConfigDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      all: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**/*',
        '.yarn/**/*',
        '.next/**/*',
        'out/**/*',
      ],
    },
    testTimeout: 300,
  },
  plugins: [tsconfigPaths(), react()],
});
