import type { Chapter, Recipe, RecipeIngredient } from '@cocktails/data';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

/**
 * A recipe reduced to what the card-list routes render. The full Recipe
 * object (about 913 bytes serialized) used to ship in the client payload of
 * every card list; the card needs a fraction of that.
 *
 * `chapter` and `page` are only consumed on book source pages, which group
 * their cards by chapter; other routes carry them unused.
 */
export type RecipeCardItem = {
  name: string;
  href: ReturnType<typeof getRecipeUrl>;
  source: string;
  searchText: string;
  chapter: Chapter | undefined;
  page: number | undefined;
};

/**
 * A card from a list rendered from one ingredient/category perspective
 * (ingredient and category pages), where each card also shows that
 * ingredient's quantity in the recipe. `quantity` stays optional per card:
 * the picker resolves the matching ingredient line, and a recipe reaching
 * the page without one is a data bug the render guards against.
 */
export type QuantityRecipeCardItem = RecipeCardItem & {
  quantity: RecipeIngredient['quantity'] | undefined;
};

/**
 * Project recipes into card items, precomputing everything the client
 * renders: url, source label, and search text. Passing `pickQuantity` (the
 * ingredient/category routes do) returns cards that carry the quantity to
 * display; omitting it returns bare cards for routes with no per-recipe
 * quantity.
 */
export function toRecipeCards(recipes: Recipe[]): RecipeCardItem[];
export function toRecipeCards(
  recipes: Recipe[],
  pickQuantity: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined,
): QuantityRecipeCardItem[];
export function toRecipeCards(
  recipes: Recipe[],
  pickQuantity?: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined,
) {
  const toBareCard = (recipe: Recipe): RecipeCardItem => {
    const bookRef = recipe.refs.find(
      (ref): ref is Extract<typeof ref, { type: 'book' }> => ref.type === 'book',
    );

    return {
      name: recipe.name,
      href: getRecipeUrl(recipe),
      source: getRecipeSource(recipe),
      searchText: getRecipeSearchText(recipe),
      chapter: recipe.chapter,
      page: bookRef?.page,
    };
  };

  if (pickQuantity == null) {
    return recipes.map(toBareCard);
  }

  return recipes.map((recipe) => ({
    ...toBareCard(recipe),
    quantity: pickQuantity(recipe),
  }));
}
