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
    exclude: ['**/node_modules', '**/.worktrees'],
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
          setupFiles: [path.join(__dirname, 'apps/web/testing/mswSetup.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          include: ['apps/web/**/*.test.{ts,tsx}'],
          // Node-environment tests of the web app belong to the unit project.
          exclude: ['**/node_modules', '**/.worktrees', 'apps/web/modules/**'],
          environment: 'happy-dom',
          environmentOptions: {
            happyDOM: { settings: { disableIframePageLoading: true } },
          },
          setupFiles: [
            path.join(__dirname, 'apps/web/testing/mswSetup.ts'),
            path.join(__dirname, 'apps/web/vitest.setup.ts'),
          ],
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
      // In a git worktree, node_modules is a symlink into the shared
      // checkout, so @cocktails/data would resolve to the shared copy and
      // tests would exercise stale data. Pointing every subpath at this
      // checkout's source keeps one module id per package either way (a
      // node_modules shadow symlink instead creates two ids and breaks
      // vi.mock); in the shared checkout itself this is a no-op.
      ...[
        ['', 'src/index.ts'],
        ['recipes', 'src/modules/recipes.ts'],
        ['categories', 'src/modules/categories.ts'],
        ['ingredients', 'src/modules/ingredients.ts'],
        ['sources', 'src/modules/sources.ts'],
        ['authors', 'src/modules/authors.ts'],
        ['bars', 'src/modules/bars.ts'],
        ['constants', 'src/modules/constants.ts'],
        ['params', 'src/modules/params.ts'],
        ['categorization-systems', 'src/modules/categorization-systems.ts'],
      ].map(([subpath, target]) => ({
        find: new RegExp(`^@cocktails/data${subpath ? `/${subpath}` : ''}$`),
        replacement: path.join(__dirname, 'packages/data', target),
      })),
    ],
  },
  plugins: [react()],
});
