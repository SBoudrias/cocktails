'use client';

import { useEffect, useState } from 'react';

/**
 * A JSON resource the whole site shares, fetched once per page session: the
 * search index, the recipe catalog. The value is `undefined` until it has
 * loaded; `getLoaded` hands back an already-loaded resource synchronously, so
 * a component mounted again (a soft navigation back) renders complete on its
 * first render.
 *
 * `urgent` loads right away (e.g. landing with `?search=` active); otherwise
 * loading waits for browser idle time with a 3 s fallback, so it never
 * competes with the first paint. A disabled hook (a page that needs no
 * resource) fetches nothing. A failed fetch is tracked in `failed` for the
 * caller to surface, and forgotten so the next call retries.
 */
export function useSharedJson<T>({
  load,
  getLoaded,
  enabled = true,
  urgent,
}: {
  load: () => Promise<T>;
  getLoaded: () => T | undefined;
  enabled?: boolean;
  urgent: boolean;
}): { value: T | undefined; failed: boolean } {
  const [value, setValue] = useState<T | undefined>(getLoaded);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const loadNow = () => {
      load()
        .then((loaded) => {
          if (!active) return;
          setFailed(false);
          setValue(loaded);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    };

    if (urgent) {
      loadNow();
      return () => {
        active = false;
      };
    }

    // Safari has no requestIdleCallback.
    if (typeof requestIdleCallback !== 'function') {
      const timer = setTimeout(loadNow, 1000);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    const handle = requestIdleCallback(loadNow, { timeout: 3000 });
    return () => {
      active = false;
      cancelIdleCallback(handle);
    };
  }, [load, getLoaded, enabled, urgent]);

  return { value, failed };
}
