import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.worktrees/**',
    '**/node_modules/**',
    'apps/**/.next/**',
    'apps/**/out/**',
  ]),
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);

export default eslintConfig;
