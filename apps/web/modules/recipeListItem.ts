import type { Chapter, Recipe, RecipeIngredient } from '@cocktails/data';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeUrl } from '#/modules/url';

/**
 * A recipe reduced to what the recipe-list routes render. The full Recipe
 * object (about 913 bytes serialized) used to ship in the client payload of
 * every recipe list; the list item needs a fraction of that. Search text is
 * not part of it: it ships once, in the shared search index (looked up by
 * `href`).
 *
 * `chapter` and `page` are only consumed on book source pages, which group
 * their items by chapter; other routes carry them unused, and catalog cards
 * (resolved at runtime) never do.
 */
export type RecipeListItem = {
  name: string;
  href: ReturnType<typeof getRecipeUrl>;
  source: string;
  chapter?: Chapter;
  page?: number;
};

/**
 * A list item from a page rendered from one ingredient/category perspective
 * (ingredient and category pages), where each item also shows that
 * ingredient's quantity in the recipe. `quantity` stays optional per item:
 * the picker resolves the matching ingredient line, and a recipe reaching
 * the page without one is a data bug the render guards against.
 */
export type QuantityRecipeListItem = RecipeListItem & {
  quantity: RecipeIngredient['quantity'] | undefined;
};

/**
 * Project recipes into list items, precomputing everything the client
 * renders: url and source label. Passing `pickQuantity` (the
 * ingredient/category routes do) returns items that carry the quantity to
 * display; omitting it returns bare items for routes with no per-recipe
 * quantity.
 */
export function toRecipeListItems(recipes: Recipe[]): RecipeListItem[];
export function toRecipeListItems(
  recipes: Recipe[],
  pickQuantity: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined,
): QuantityRecipeListItem[];
export function toRecipeListItems(
  recipes: Recipe[],
  pickQuantity?: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined,
) {
  const toBareItem = (recipe: Recipe): RecipeListItem => {
    const bookRef = recipe.refs.find(
      (ref): ref is Extract<typeof ref, { type: 'book' }> => ref.type === 'book',
    );

    return {
      name: recipe.name,
      href: getRecipeUrl(recipe),
      source: getRecipeSource(recipe),
      chapter: recipe.chapter,
      page: bookRef?.page,
    };
  };

  if (pickQuantity == null) {
    return recipes.map(toBareItem);
  }

  return recipes.map((recipe) => ({
    ...toBareItem(recipe),
    quantity: pickQuantity(recipe),
  }));
}
