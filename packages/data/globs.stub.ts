/**
 * Vitest-only stub for ./globs.ts (wired in vitest.config.ts).
 *
 * Tests read data JSON through the node:fs fallback in readJSONFile instead
 * of the module-graph loaders: exercising the real import.meta.glob under
 * vitest pays a one-time multi-second transform of the ~4k-file glob map, and
 * Vite's glob semantics differ from Turbopack's anyway — the dev-server
 * behavior that matters is verified against `next dev` directly. See
 * ./globs.ts for details.
 *
 * When vitest's globalSetup (apps/web/testing/dataBundle.globalSetup.ts) has
 * snapshotted the corpus into a temp bundle, this stub serves file contents
 * from it instead: one bulk read per worker replaces the thousands of small
 * async fs reads that would otherwise flood libuv's 4-thread I/O pool and
 * starve Vite's transforms (which share the same pool). The bundle is a
 * per-run snapshot of the JSON files, never a source of truth: a path absent
 * from it returns no loader and readJSONFile falls back to reading the file
 * from disk.
 */

import { readFileSync } from 'node:fs';

function loadBundle(): Record<string, string> | undefined {
  const bundlePath = process.env.COCKTAILS_TEST_DATA_BUNDLE;
  if (!bundlePath) return undefined;

  // Synchronous on purpose: a single ~4 MB read per worker thread, parsed
  // once at module load and cached, keeps every subsequent loader call off
  // the libuv fs thread pool entirely. JSON.parse's untyped return carries
  // the Record conversion.
  return JSON.parse(readFileSync(bundlePath, 'utf8'));
}

const bundle = loadBundle();

/**
 * Look up the lazy loader for a data file. `relativePath` is relative to the
 * package root without a leading `./` (e.g. data/recipes/book/x.json).
 */
export function getJSONLoader(
  relativePath: string,
): (() => Promise<unknown>) | undefined {
  const content = bundle?.[relativePath];
  if (content === undefined) return undefined;

  return () => Promise.resolve(JSON.parse(content));
}
