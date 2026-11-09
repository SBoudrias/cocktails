import type { SearchIndex } from '#/modules/buildSearchIndex';

/**
 * next.config.ts sets `basePath` from the same expression; a client module
 * cannot import the config, so the default is mirrored here.
 */
const SEARCH_INDEX_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails'}/data/search-index.json`;

let cached: Promise<SearchIndex> | undefined;

/**
 * Fetch the search index once per page session. Concurrent and later callers
 * share the same promise; a failed fetch is forgotten so the next call
 * retries. The browser's HTTP cache covers repeat sessions.
 */
export function loadSearchIndex(): Promise<SearchIndex> {
  cached ??= fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index request failed: ${response.status}`);
      }
      return response.json();
    })
    .catch((error: unknown) => {
      cached = undefined;
      throw error;
    });

  return cached;
}

/**
 * Start loading without waiting for the result (search box focus, idle time).
 * Errors are swallowed here and surface on the next `loadSearchIndex` call.
 */
export function preloadSearchIndex(): void {
  loadSearchIndex().catch(() => {});
}

/**
 * Search strings aligned with `items`, for the fuzzy search haystack. While
 * the index is not loaded (or lacks the href) the item's name stands in, so
 * typing before the fetch lands still filters by name.
 */
export function getSearchTexts(
  items: { href: string; name: string }[],
  index: SearchIndex | undefined,
): string[] {
  return items.map((item) => index?.[item.href]?.searchText ?? item.name.toLowerCase());
}

/** Test seam: forget the cached index. */
export function resetSearchIndexCache(): void {
  cached = undefined;
}
