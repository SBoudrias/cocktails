import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    clearMocks: true,
  },
});
