/**
 * A JSON resource the whole site shares, fetched once per page session: the
 * search index, the recipe catalog. `createSharedJson` wires a URL under the
 * app's base path to the loader pair `useSharedJson` consumes.
 *
 * The cache lives at module level on purpose: it spans mounts and soft
 * navigations (one fetch per session, shared by every page) and hands loaded
 * values back synchronously, so a page revisited renders complete on its
 * first render. A hook-local cache would refetch per mount instead.
 *
 * Every created resource registers here, so tests can reset the session
 * caches between runs (testing/mswSetup.ts) and flush in-flight loads after
 * mounting (vitest.setup.ts) without each module exporting its own seams.
 */
const resources: SharedJsonResource<unknown>[] = [];

type SharedJsonResource<T> = {
  load: () => Promise<T>;
  getLoaded: () => T | undefined;
  reset: () => void;
  /** The fetch in flight, while the session has not loaded yet. */
  getPending: () => Promise<unknown> | undefined;
};

/**
 * Create a shared JSON resource at a path under the app's base path. The URL
 * resolves against the page's origin; next.config.ts sets `basePath` from the
 * same expression, and a client module cannot import the config, so the
 * default is mirrored here.
 */
export function createSharedJson<T>(path: string): SharedJsonResource<T> {
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

  const resource: SharedJsonResource<T> = {
    load,
    /** The resource if it has already loaded this session, synchronously. */
    getLoaded: () => loaded,
    /** Test seam: forget the cached resource. */
    reset: () => {
      cached = undefined;
      loaded = undefined;
    },
    getPending: () => (loaded == null ? cached : undefined),
  };

  resources.push(resource as SharedJsonResource<unknown>);

  return resource;
}

/** Test seam: reset every shared resource's session cache. */
export function resetSharedJson(): void {
  for (const resource of resources) resource.reset();
}

/**
 * The fetches still in flight across all shared resources (a resource that
 * already loaded, or has nothing pending, contributes nothing). setupApp
 * awaits these after mounting, so tests assert on complete lists without
 * waiting per-assertion.
 */
export function getPendingSharedJsonLoads(): Promise<unknown>[] {
  return resources.flatMap((resource) => {
    const pending = resource.getPending();
    return pending ? [pending] : [];
  });
}
