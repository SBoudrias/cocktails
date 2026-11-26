import fs from 'node:fs/promises';
import path from 'node:path';
import { getJSONLoader } from '../../globs';
import { PACKAGE_ROOT } from './constants';

declare global {
  var __cocktailsTestRawJsonCache: Map<string, string | null> | undefined;
}

function getTestRawJsonCache(): Map<string, string | null> | undefined {
  if (!process.env.VITEST) return undefined;
  globalThis.__cocktailsTestRawJsonCache ??= new Map();
  return globalThis.__cocktailsTestRawJsonCache;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

export async function readJSONFile<T>(filepath: string): Promise<T | undefined> {
  // Prefer loading through the bundler's module graph so data files
  // participate in dev hot-reload (see ../../globs.ts). Loader results are
  // shared module objects, so round-trip through JSON.parse both to give each
  // caller a fresh object (matching a node:fs read) and to let JSON.parse's
  // untyped return carry the T conversion.
  const loader = getJSONLoader(path.relative(PACKAGE_ROOT, filepath));
  if (loader) {
    // Module namespace objects from import.meta.glob throw DataCloneError in
    // structuredClone, and JSON.parse also supplies the untyped T return.
    // oxlint-disable-next-line unicorn/prefer-structured-clone
    return JSON.parse(JSON.stringify(await loader()));
  }

  // Under Vitest, the data corpus (~4,800 JSON files, ~3.9 MB total) is
  // read-only, while test-file isolation re-imports the data modules and drops
  // memo caches between files. Caching the raw UTF-8 strings per worker thread
  // avoids re-reading thousands of files from disk on every test file while
  // still returning a freshly parsed object per call.
  const testCache = getTestRawJsonCache();
  if (testCache?.has(filepath)) {
    const cached = testCache.get(filepath);
    return cached == null ? undefined : JSON.parse(cached);
  }

  // Fallback for files not (yet) in the module graph, e.g. JSON files created
  // while the dev server is running. Read directly and treat ENOENT as missing
  // instead of issuing a separate fs.access syscall per file.
  try {
    const content = await fs.readFile(filepath, 'utf8');
    testCache?.set(filepath, content);
    return JSON.parse(content);
  } catch (error) {
    if (isNotFoundError(error)) {
      testCache?.set(filepath, null);
      return undefined;
    }
    throw error;
  }
}
