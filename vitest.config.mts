import path from 'node:path';
import react from '@vitejs/plugin-react';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    clearMocks: true,
    server: {
      deps: {
        // Work around https://github.com/mui/material-ui/issues/48636.
        inline: ['@mui/material'],
      },
    },
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
          environmentOptions: {
            happyDOM: { settings: { disableIframePageLoading: true } },
          },
          setupFiles: [path.join(__dirname, 'apps/web/vitest.setup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'page',
          include: ['apps/web/app/**/*.test.tsx'],
          environment: 'happy-dom',
          environmentOptions: {
            happyDOM: { settings: { disableIframePageLoading: true } },
          },
          setupFiles: [path.join(__dirname, 'apps/web/vitest.setup.ts')],
        },
      },
    ],
  },
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Tests read data JSON through the node:fs fallback (see
      // packages/data/globs.stub.ts): transforming the real import.meta.glob
      // under vitest costs a one-time multi-second pass over the ~4k data
      // files, and Vite's glob semantics differ from Turbopack's anyway.
      {
        find: '../../globs',
        replacement: path.join(__dirname, 'packages/data/globs.stub.ts'),
      },
    ],
  },
  plugins: [react()],
});
