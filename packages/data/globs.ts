/**
 * Data-file loaders that live inside the bundler's module graph.
 *
 * `import.meta.glob` is transformed at compile time by Turbopack (`next dev` /
 * `next build`) and by Vite (vitest) into a static map of `path -> lazy
 * loader`. Loading JSON through it (instead of `node:fs`) makes every data
 * file a module-graph dependency: the dev server then watches them, so
 * editing a JSON file hot-reloads the site without any custom invalidation.
 *
 * IMPORTANT: this file must stay at the package root. Turbopack silently
 * expands glob patterns containing `..` segments to an empty list, so the
 * `./data/...` patterns below only resolve from here.
 *
 * Files are still enumerated with `node:fs` in the modules, and readJSONFile
 * falls back to a `node:fs` read for paths missing from this map (e.g. files
 * created after the dev server started, before Turbopack re-expands the glob).
 */

const jsonLoaders: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob('./data/categories/*.json'),
  ...import.meta.glob('./data/ingredients/**/*.json'),
  ...import.meta.glob('./data/recipes/**/*.json'),
};

/**
 * Look up the lazy loader for a data file. `relativePath` is relative to the
 * package root without a leading `./` (e.g. `data/recipes/book/x.json`).
 */
export function getJSONLoader(
  relativePath: string,
): (() => Promise<unknown>) | undefined {
  return jsonLoaders[`./${relativePath}`];
}
