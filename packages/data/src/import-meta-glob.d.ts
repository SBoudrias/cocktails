/**
 * Type support for `import.meta.glob` in this package's standalone `tsc` run.
 *
 * apps/web gets the identical declaration from Next.js (via next-env.d.ts ->
 * next/types/global.d.ts), but this package's tsconfig does not include Next
 * types. Turbopack and Vite transform the glob calls at compile time; this
 * file is types only and does nothing at runtime.
 */
interface ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
