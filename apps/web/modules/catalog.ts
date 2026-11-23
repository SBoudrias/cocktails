import type { Catalog } from '#/modules/buildCatalog';
import type { QuantityRecipeListItem } from '#/modules/recipeListItem';
import { createSharedJson } from '#/modules/sharedJson';
import { isRecipeUrl } from '#/modules/url';

export const { load: loadCatalog, getLoaded: getLoadedCatalog } =
  createSharedJson<Catalog>('data/catalog.json');

/**
 * A page's list out of a catalog: each entry resolved against the catalog's
 * cards. Entries whose href the catalog does not know are skipped, never
 * mislabeled; a list the catalog does not carry renders no rows (the caller
 * shows its loading state while the catalog itself has not loaded).
 *
 * An entry may carry its page's own secondary line in place of the card's
 * source (the author pages' original-vs-adaptation line); without one the
 * row falls back to the card, as every other page does.
 */
export function getCatalogList(
  catalog: Catalog | undefined,
  key: string,
): QuantityRecipeListItem[] {
  if (catalog == null) return [];

  const list = catalog.lists[key];
  if (list == null) return [];

  return list.flatMap(([href, quantity, source]) => {
    const card = catalog.cards[href];
    if (card == null || !isRecipeUrl(href)) return [];

    return [
      {
        href,
        name: card[0],
        source: source ?? card[1],
        quantity: quantity ?? undefined,
      },
    ];
  });
}
