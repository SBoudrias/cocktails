import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Vitest globalSetup: snapshot the read-only data corpus (~4,800 JSON files,
 * ~4 MB) into a single temp file before the worker pool starts, and point the
 * vitest globs stub (packages/data/globs.stub.ts) at it through the
 * COCKTAILS_TEST_DATA_BUNDLE environment variable (inherited by every worker
 * of the threads pool).
 *
 * Why: under the threads pool, each worker's cold data pass issues thousands
 * of small async fs reads, and together they flood Node's 4-thread libuv I/O
 * pool — the same pool Vite's module transforms queue on — which starves the
 * whole run. One bulk read here, then one bundle read per worker, sidesteps
 * the pool almost entirely: parsing the whole corpus is only ~10 ms, the reads
 * are what cost.
 *
 * The bundle is a throwaway snapshot in the OS temp dir. The JSON files stay
 * the source of truth, nothing is committed, and the teardown deletes the
 * file. A data file created after this setup is simply absent from the
 * snapshot: the stub returns no loader for it and readJSONFile falls back to
 * reading it from disk, exactly as before.
 */

const testingDir = import.meta.dirname;
const packageRoot = path.resolve(testingDir, '../../../packages/data');

export default async function globalSetup(): Promise<() => Promise<void>> {
  // Keys are relative to the package root in the same format getJSONLoader
  // expects ('data/recipes/book/x.json'), so the stub can look them up
  // directly.
  const files = await Array.fromAsync(fs.glob('data/**/*.json', { cwd: packageRoot }));

  // A silent zero here (a path or glob-semantics change) would quietly
  // disable the bundle and every read would fall back to per-file fs reads,
  // so fail loudly instead of degrading invisibly.
  if (files.length === 0) {
    throw new Error(
      `No data JSON files found under ${packageRoot} — the test data bundle is empty.`,
    );
  }

  const startedAt = performance.now();
  const contents = await Promise.all(
    files.map((file) => fs.readFile(path.join(packageRoot, file), 'utf8')),
  );
  const readMs = Math.round(performance.now() - startedAt);

  const bundlePath = path.join(
    os.tmpdir(),
    // The pid keeps parallel runs (worktrees, other agents) from sharing a
    // bundle; each run only ever reads its own.
    `cocktails-data-bundle-${process.pid}.json`,
  );

  // One line per run in the CI log proves the bundle is actually active —
  // with it missing, tests still pass but silently fall back to per-file
  // reads (this is exactly how a regression would hide).
  // oxlint-disable-next-line no-console
  console.log(
    `[vitest] data bundle: ${files.length} files read in ${readMs}ms -> ${path.basename(bundlePath)}`,
  );

  try {
    await fs.writeFile(
      bundlePath,
      JSON.stringify(
        Object.fromEntries(files.map((file, index) => [file, contents[index]])),
      ),
    );
  } catch (error) {
    await fs.rm(bundlePath, { force: true });
    throw error;
  }

  process.env.COCKTAILS_TEST_DATA_BUNDLE = bundlePath;

  return async () => {
    await fs.rm(bundlePath, { force: true });
  };
}
