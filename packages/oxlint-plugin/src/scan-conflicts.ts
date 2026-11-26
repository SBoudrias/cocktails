#!/usr/bin/env -S node --no-warnings

/**
 * Whole-tree merge-conflict marker scan — the second half of the lint
 * pipeline. The oxlint rule (`packages/oxlint-plugin/src/plugin.ts`) only
 * sees files oxlint parses; this catches JSON data files, schemas, CSS,
 * Markdown and everything else. Same detection logic, shared through
 * `detect.ts`.
 *
 *   node packages/oxlint-plugin/src/scan-conflicts.ts
 *
 * Runs as the last step of the root `yarn lint` script, so local runs and
 * CI's lint job both fail on it. The file list comes from git (tracked
 * files plus untracked-but-not-ignored), so ignored trees — node_modules,
 * .worktrees, build output, the tmp scratch dir — are never scanned, and
 * what CI checks out is exactly what this gate sees locally.
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { findConflictMarkers } from './detect.ts';

const ROOT = new URL('../../../', import.meta.url).pathname;

/** Extensions whose content is not text a marker could hide in. */
const BINARY_EXTENSIONS = new Set([
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.zip',
]);

function hasBinaryExtension(path: string): boolean {
  const dot = path.lastIndexOf('.');
  return dot !== -1 && BINARY_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

/**
 * Every reportable conflict marker requires `<<<<<<<`, `>>>>>>>`, or `|||||||`
 * (`=======` is only reported inside an open conflict block). Checking for
 * those three substrings avoids splitting clean files into line arrays.
 */
function mayContainConflictMarker(content: string): boolean {
  return (
    content.includes('<<<<<<<') ||
    content.includes('>>>>>>>') ||
    content.includes('|||||||')
  );
}

const gitFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { cwd: ROOT, encoding: 'utf8' },
)
  .split('\n')
  .filter((path) => path !== '' && !hasBinaryExtension(path));

const results = await Promise.all(
  gitFiles.map(async (path) => {
    let content: string;
    try {
      content = await readFile(join(ROOT, path), 'utf8');
    } catch {
      // Unreadable right now (deleted-but-listed, permissions): not a
      // conflict-marker risk we can judge — git or the build fails on it.
      return [];
    }
    if (!mayContainConflictMarker(content)) return [];
    return findConflictMarkers(content.split('\n')).map((marker) => ({ path, marker }));
  }),
);

let failures = 0;
for (const fileMatches of results) {
  for (const { path, marker } of fileMatches) {
    failures++;
    console.error(
      `::error::${path}:${marker.line}: left-behind merge conflict marker: ${marker.text}`,
    );
  }
}

if (failures > 0) {
  console.error(
    `\nCONFLICT MARKERS FOUND (${failures}) — resolve the merge and remove the marker lines.`,
  );
  process.exit(1);
}
