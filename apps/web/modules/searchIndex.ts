import type { SearchIndex } from '#/modules/buildSearchIndex';
import { createSharedJson } from '#/modules/sharedJson';

export const {
  load: loadSearchIndex,
  getLoaded: getLoadedSearchIndex,
  reset: resetSearchIndexCache,
} = createSharedJson<SearchIndex>('data/search-index.json');

/**
 * Start loading without waiting for the result (search box focus, idle time).
 * Errors are swallowed here and surface on the next `loadSearchIndex` call.
 */
export function preloadSearchIndex(): void {
  loadSearchIndex().catch(() => {});
}

/**
 * An item's search string, for the fuzzy search haystack. While the index is
 * not loaded (or lacks the href) the item's name stands in, so typing before
 * the fetch lands still filters by name.
 */
export function getIndexedSearchText(
  item: { href: string; name: string },
  index: SearchIndex | undefined,
): string {
  return index?.[item.href]?.searchText ?? item.name.toLowerCase();
}
