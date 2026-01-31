import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tools/test-setup.ts'],
    clearMocks: true,
    exclude: ['node_modules', '.worktrees'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tools/**/*',
        '.yarn/**/*',
        '.next/**/*',
        'out/**/*',
      ],
    },
  },
  plugins: [tsconfigPaths(), react()],
});
