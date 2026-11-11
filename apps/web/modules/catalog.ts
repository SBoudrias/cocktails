import type { Catalog } from '#/modules/buildCatalog';
import type { QuantityRecipeListItem } from '#/modules/recipeListItem';
import { isRecipeUrl } from '#/modules/url';

/**
 * The catalog URL under the app's base path, resolved against the page's
 * origin. Mirrors the `basePath` default in next.config.ts and searchIndex.ts.
 */
function getCatalogUrl(): string {
  const basePath = new URL(
    `${process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails'}/`,
    location.origin,
  );

  return new URL('data/catalog.json', basePath).href;
}

let cached: Promise<Catalog> | undefined;
let loaded: Catalog | undefined;

/**
 * The catalog if it has already loaded this session, synchronously. A page
 * mounted again by a soft navigation back renders its full list on the first
 * render, so its scroll position comes back onto the same content.
 */
export function getLoadedCatalog(): Catalog | undefined {
  return loaded;
}

/**
 * Fetch the catalog once per page session. Concurrent and later callers share
 * the same promise; a failed fetch is forgotten so the next call retries. The
 * browser's HTTP cache covers repeat sessions.
 */
export function loadCatalog(): Promise<Catalog> {
  cached ??= fetch(getCatalogUrl())
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((catalog: Catalog) => {
      loaded = catalog;
      return catalog;
    })
    .catch((error: unknown) => {
      cached = undefined;
      throw error;
    });

  return cached;
}

/**
 * A page's list out of a catalog: each entry resolved against the catalog's
 * cards. `undefined` when the catalog has not loaded yet (or does not know
 * the key: a page newer than the cached catalog) — the caller shows its
 * loading state. Entries whose href the catalog does not know are skipped,
 * never mislabeled.
 */
export function getCatalogList(
  catalog: Catalog | undefined,
  key: string,
): QuantityRecipeListItem[] | undefined {
  if (catalog == null) return undefined;
  const list = catalog.lists[key];
  if (list == null) return undefined;

  return list.flatMap(([href, quantity]) => {
    const card = catalog.cards[href];
    if (card == null || !isRecipeUrl(href)) return [];

    return [
      {
        href,
        name: card[0],
        source: card[1],
        quantity: quantity ?? undefined,
      },
    ];
  });
}

/** Test seam: forget the cached catalog. */
export function resetCatalogCache(): void {
  cached = undefined;
  loaded = undefined;
}
