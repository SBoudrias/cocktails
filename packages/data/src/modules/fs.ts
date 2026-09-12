import fs from 'node:fs/promises';
import path from 'node:path';
import { getJSONLoader } from '../../globs';
import { PACKAGE_ROOT } from './constants';

export async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
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
    return JSON.parse(JSON.stringify(await loader()));
  }

  // Fallback for files not (yet) in the module graph, e.g. JSON files created
  // while the dev server is running.
  if (await fileExists(filepath)) {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  return undefined;
}
