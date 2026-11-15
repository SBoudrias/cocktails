import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The CSS-module ↔ component contract, both directions:
// - every `styles.key` a component reads must exist in the module it imports
//   (an undefined class is a silently-unstyled element otherwise)
// - every class a module defines must be read somewhere (dead keys are dead
//   code the user asked to eliminate)
//
// Scans apps/web for *.module.css and the .ts/.tsx files co-located with
// them (the convention: only the component next to the module uses it),
// plus any other file importing that module path.

const webRoot = path.join(__dirname, '..');
const modules: string[] = [];
(function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'out') continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.module.css')) modules.push(full);
  }
})(webRoot);

const failures: string[] = [];

for (const modulePath of modules) {
  const css = readFileSync(modulePath, 'utf8');
  const defined = new Set(
    [...css.matchAll(/^\.([a-zA-Z][a-zA-Z0-9_-]*)\s*[,{]/gm)].map((m) => m[1]!),
  );

  // The module's path relative to the web app, for failure messages.
  const relFromWeb = path.relative(webRoot, modulePath).replaceAll('\\', '/');

  // Gather consumers: every ts/tsx under webRoot that imports this module
  // (path ends with the same basename).
  const usedKeys = new Set<string>();
  let consumerCount = 0;
  (function walkSources(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'out') continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walkSources(full);
        continue;
      }
      if (!entry.endsWith('.tsx') && !entry.endsWith('.ts')) continue;
      const src = readFileSync(full, 'utf8');
      if (!src.includes('.module.css')) continue;
      // Resolve every .module.css import to its actual file, so consumers
      // are attributed to exactly the module they import (most modules share
      // the basename style.module.css — matching on the name alone would
      // cross-wire them).
      const srcWithoutImports = src.replaceAll(/^import[^\n]*$/gm, '');
      for (const m of src.matchAll(
        /import\s+(\w+)\s+from\s+['"]([^'"]+\.module\.css)['"]/g,
      )) {
        const alias = m[1]!;
        const specifier = m[2]!;
        const resolved = specifier.startsWith('#/')
          ? path.resolve(webRoot, specifier.slice(2))
          : path.resolve(path.dirname(full), specifier);
        if (resolved !== modulePath) continue;
        consumerCount += 1;
        const keyPattern = new RegExp(`${alias}\\.([a-zA-Z][a-zA-Z0-9_]*)`, 'g');
        for (const read of srcWithoutImports.matchAll(keyPattern)) {
          usedKeys.add(read[1]!);
        }
      }
    }
  })(webRoot);

  const missing = [...usedKeys].filter((key) => !defined.has(key));
  const dead = [...defined].filter((key) => !usedKeys.has(key));

  for (const key of missing) {
    failures.push(`${relFromWeb}: styles.${key} is read but not defined in the module`);
  }
  for (const key of dead) {
    failures.push(`${relFromWeb}: .${key} is defined but never read (dead CSS)`);
  }
}

describe('css module ↔ component sync', () => {
  it('has no undefined styles reads and no dead css keys', () => {
    expect(failures).toEqual([]);
  });
});

if (failures.length > 0) {
  throw new Error(`CSS module ↔ component drift:\n${failures.join('\n')}`);
}
