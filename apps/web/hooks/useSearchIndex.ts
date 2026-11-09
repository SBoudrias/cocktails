'use client';

import { useEffect, useState } from 'react';
import type { SearchIndex } from '#/modules/buildSearchIndex';
import { loadSearchIndex } from '#/modules/searchIndex';

/**
 * The search index, or `undefined` until it has loaded. It loads when the
 * browser is idle after mount, or right away when `urgent` (a search term is
 * already active, e.g. landing on `?search=`). Search-box focus can call
 * `preloadSearchIndex` to jump the idle wait.
 */
export function useSearchIndex({ urgent }: { urgent: boolean }): SearchIndex | undefined {
  const [index, setIndex] = useState<SearchIndex>();

  useEffect(() => {
    let active = true;
    const load = () => {
      loadSearchIndex()
        .then((loaded) => {
          if (active) setIndex(loaded);
        })
        .catch(() => {});
    };

    if (urgent) {
      load();
      return () => {
        active = false;
      };
    }

    // Safari has no requestIdleCallback.
    if (typeof requestIdleCallback !== 'function') {
      const timer = setTimeout(load, 1000);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    const handle = requestIdleCallback(load, { timeout: 3000 });
    return () => {
      active = false;
      cancelIdleCallback(handle);
    };
  }, [urgent]);

  return index;
}
