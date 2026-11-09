import type { BaseIngredient, Category } from '@cocktails/data';
import { getIngredientOrCategorySearchText } from '#/modules/searchText';
import { getIngredientUrl } from '#/modules/url';

/**
 * An ingredient or category reduced to what the ingredient/bottle list routes
 * render. The full objects (refs, descriptions, parent categories...) used to
 * ship in the client payload of those lists; a row needs a name and a link.
 */
export type IngredientListItem = {
  name: string;
  href: ReturnType<typeof getIngredientUrl>;
  searchText: string;
};

/**
 * Project ingredients and categories into list items, precomputing what the
 * client renders and searches: url and search text.
 */
export function toIngredientListItems(
  items: (BaseIngredient | Category)[],
): IngredientListItem[] {
  return items.map((item) => ({
    name: item.name,
    href: getIngredientUrl(item),
    searchText: getIngredientOrCategorySearchText(item),
  }));
}
