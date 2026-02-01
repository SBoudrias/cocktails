import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/*.test.ts', 'apps/web/modules/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['apps/web/components/**/*.test.tsx'],
          environment: 'happy-dom',
          setupFiles: [path.join(__dirname, 'apps/web/testing/setup-component.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'page',
          include: ['apps/web/app/**/*.test.tsx'],
          environment: 'happy-dom',
          setupFiles: [path.join(__dirname, 'apps/web/testing/setup-page.ts')],
        },
      },
    ],
  },
  plugins: [tsconfigPaths(), react()],
});
