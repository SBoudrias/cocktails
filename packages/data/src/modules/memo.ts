import fs from 'node:fs';
import lodashMemoize from 'lodash/memoize';
import { DATA_ROOT } from './constants';

/**
 * Drop-in replacement for `lodash/memoize` shared by all data modules.
 *
 * Data files are immutable in production and tests, so memoized results live
 * for the whole process. The Next.js dev server is the exception: JSON files
 * are edited while the server runs, and Turbopack cannot watch them (they are
 * read with `node:fs` at runtime, never imported). So in development we watch
 * the data directory ourselves and clear every registered cache when a JSON
 * file changes. The next request then re-reads the files from disk.
 */

type Cache = { clear: () => void };

declare global {
  var __cocktailsDataCaches: Cache[] | undefined;
  var __cocktailsDataWatcherActive: boolean | undefined;
}

// Shared through globalThis so every module instance registers into (and is
// invalidated through) the same registry. The dev server may load this module
// more than once, e.g. after hot updates.
const caches: Cache[] = globalThis.__cocktailsDataCaches ?? [];
globalThis.__cocktailsDataCaches = caches;

function watchDataFilesInDev() {
  if (process.env.NODE_ENV !== 'development') return;
  if (globalThis.__cocktailsDataWatcherActive) return;
  globalThis.__cocktailsDataWatcherActive = true;

  try {
    fs.watch(DATA_ROOT, { recursive: true }, (_event, filename) => {
      if (typeof filename !== 'string' || !filename.endsWith('.json')) return;

      for (const cache of caches) cache.clear();
      console.log(`[cocktails/data] ${filename} changed, cache cleared`);
    });
  } catch (error) {
    // Watching is only a dev convenience; never break data loading over it.
    console.warn('[cocktails/data] dev file watching failed:', error);
  }
}

export default function memo<T extends (...args: never[]) => unknown>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string,
): T {
  const memoized = lodashMemoize(fn, resolver);

  caches.push({
    clear: () => {
      memoized.cache.clear?.();
    },
  });
  watchDataFilesInDev();

  return memoized;
}
