import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    environment: 'happy-dom',
    setupFiles: [path.join(__dirname, 'tools/test-setup.ts')],
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
