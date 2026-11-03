import type { Chapter, Recipe, RecipeIngredient } from '@cocktails/data';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

/**
 * A recipe reduced to what the card-list routes render. The full Recipe
 * object (about 913 bytes serialized) used to ship in the client payload of
 * every card list; the card needs a fraction of that.
 *
 * `quantity` carries the ingredient quantity when the list is rendered from
 * one ingredient/category perspective (ingredient and category pages).
 * `chapter` and `page` are only set on book source pages, which group their
 * cards by chapter.
 */
export type RecipeCardItem = {
  name: string;
  href: ReturnType<typeof getRecipeUrl>;
  source: string;
  quantity: RecipeIngredient['quantity'] | undefined;
  searchText: string;
  chapter: Chapter | undefined;
  page: number | undefined;
};

/**
 * Project recipes into card items, precomputing everything the client
 * renders: url, source label, and search text. `pickQuantity` receives each
 * recipe's ingredients and returns the quantity to display (or nothing when
 * the route has no per-recipe quantity).
 */
export function toRecipeCards(
  recipes: Recipe[],
  pickQuantity: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined = () =>
    undefined,
): RecipeCardItem[] {
  return recipes.map((recipe) => {
    const bookRef = recipe.refs.find(
      (ref): ref is Extract<typeof ref, { type: 'book' }> => ref.type === 'book',
    );

    return {
      name: recipe.name,
      href: getRecipeUrl(recipe),
      source: getRecipeSource(recipe),
      quantity: pickQuantity(recipe),
      searchText: getRecipeSearchText(recipe),
      chapter: recipe.chapter,
      page: bookRef?.page,
    };
  });
}
