'use client';

import { useSharedJson } from '#/hooks/useSharedJson';
import type { SearchIndex } from '#/modules/buildSearchIndex';
import { loadSearchIndex } from '#/modules/searchIndex';
import { getLoadedSearchIndex } from '#/modules/searchIndex';

/**
 * The search index, or `undefined` until it has loaded. It loads when the
 * browser is idle after mount, or right away when `urgent` (a search term is
 * already active, e.g. landing on `?search=`). Search-box focus can call
 * `preloadSearchIndex` to jump the idle wait. A failed fetch surfaces on the
 * next call; lists fall back to matching names until then.
 */
export function useSearchIndex({ urgent }: { urgent: boolean }): SearchIndex | undefined {
  const { value } = useSharedJson({
    load: loadSearchIndex,
    getLoaded: getLoadedSearchIndex,
    urgent,
  });

  return value;
}
