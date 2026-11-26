import fs from 'node:fs/promises';

/**
 * Process-scoped cache of UTF-8 file contents for a single `check-data` CLI run.
 *
 * Multiple passes (`loadContext`, `validateFiles`, `reportDuplicateRecipes`,
 * `reportDuplicateBookAttributions`) read the same ~4,800 data JSON files.
 * Caching the raw strings and updating them on `writeJSON` / `fs.rename` keeps
 * every pass faithful to autofix mutations while reading each file from disk
 * once instead of up to four times.
 */
const rawFileCache = new Map<string, string>();

export async function readDataFile(filepath: string): Promise<string> {
  const cached = rawFileCache.get(filepath);
  if (cached !== undefined) return cached;
  const content = await fs.readFile(filepath, 'utf-8');
  rawFileCache.set(filepath, content);
  return content;
}

export function cacheWrittenDataFile(filepath: string, content: string): void {
  rawFileCache.set(filepath, content);
}

export function renameCachedDataFile(oldPath: string, newPath: string): void {
  const cached = rawFileCache.get(oldPath);
  if (cached !== undefined) {
    rawFileCache.delete(oldPath);
    rawFileCache.set(newPath, cached);
  }
}
