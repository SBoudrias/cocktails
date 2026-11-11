/**
 * A JSON resource the whole site shares, fetched once per page session: the
 * search index, the recipe catalog. `createSharedJson` wires a URL under the
 * app's base path to the loader pair `useSharedJson` consumes.
 *
 * The URL resolves against the page's origin; next.config.ts sets `basePath`
 * from the same expression, and a client module cannot import the config, so
 * the default is mirrored here.
 */
export function createSharedJson<T>(path: string) {
  function getUrl(): string {
    const basePath = new URL(
      `${process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails'}/`,
      location.origin,
    );

    return new URL(path, basePath).href;
  }

  let cached: Promise<T> | undefined;
  let loaded: T | undefined;

  /**
   * Fetch the resource once per page session. Concurrent and later callers
   * share the same promise; a failed fetch is forgotten so the next call
   * retries. The browser's HTTP cache covers repeat sessions.
   */
  function load(): Promise<T> {
    cached ??= fetch(getUrl())
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((value: T) => {
        loaded = value;
        return value;
      })
      .catch((error: unknown) => {
        cached = undefined;
        throw error;
      });

    return cached;
  }

  return {
    load,
    /** The resource if it has already loaded this session, synchronously. */
    getLoaded: () => loaded,
    /** Test seam: forget the cached resource. */
    reset: () => {
      cached = undefined;
      loaded = undefined;
    },
  };
}
