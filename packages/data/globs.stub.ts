/**
 * Vitest-only stub for ./globs.ts (wired in vitest.config.ts).
 *
 * Tests read data JSON through the node:fs fallback in readJSONFile instead
 * of the module-graph loaders: exercising the real import.meta.glob under
 * vitest pays a one-time multi-second transform of the ~4k-file glob map, and
 * Vite's glob semantics differ from Turbopack's anyway — the dev-server
 * behavior that matters is verified against `next dev` directly. See
 * ./globs.ts for details.
 */

export function getJSONLoader(): undefined {
  return undefined;
}
