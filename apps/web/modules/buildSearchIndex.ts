import { getAllRecipes } from '@cocktails/data/recipes';
import { toRecipeListItems } from '#/modules/recipeListItem';
import type { RecipeListItem } from '#/modules/recipeListItem';

/**
 * What global search needs to match and render a recipe that is not on the
 * current page.
 */
export type SearchIndexEntry = Pick<RecipeListItem, 'name' | 'source' | 'searchText'>;

/**
 * Every recipe, keyed by recipe href. The key makes the file deploy-skew
 * tolerant: a page and an index built from different data still match on
 * whatever hrefs they share.
 */
export type SearchIndex = Record<string, SearchIndexEntry>;

/**
 * Build the index from projected list items (the single source of
 * `searchText`), with keys in code-unit order. The output feeds the build
 * artifact cache, so it must not depend on input order or on the locale.
 */
export function buildSearchIndex(
  items: (SearchIndexEntry & { href: string })[],
): SearchIndex {
  const sorted = items.toSorted((a, b) => {
    if (a.href === b.href) return 0;
    return a.href < b.href ? -1 : 1;
  });

  return Object.fromEntries(
    sorted.map(({ href, name, source, searchText }) => [
      href,
      { name, source, searchText },
    ]),
  );
}

/**
 * Serialize the index of every recipe in the data package. Minified, since
 * the file is only ever read by `fetch`.
 */
export async function getSerializedSearchIndex(): Promise<string> {
  return JSON.stringify(buildSearchIndex(toRecipeListItems(await getAllRecipes())));
}
