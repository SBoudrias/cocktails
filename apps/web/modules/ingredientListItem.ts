import type { BaseIngredient, Category } from '@cocktails/data';
import { getIngredientOrCategorySearchText } from '#/modules/searchText';
import { sentenceCase } from '#/modules/sentenceCase';
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
 * client renders and searches: url and search text. Generic ingredient names
 * ship lowercase ("lime"); rows start them with a capital like every other
 * list label.
 */
export function toIngredientListItems(
  items: (BaseIngredient | Category)[],
): IngredientListItem[] {
  return items.map((item) => ({
    name: sentenceCase(item.name),
    href: getIngredientUrl(item),
    searchText: getIngredientOrCategorySearchText(item),
  }));
}
