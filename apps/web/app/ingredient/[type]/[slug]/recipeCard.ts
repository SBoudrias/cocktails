import type { Recipe, RecipeIngredient, RootIngredient } from '@cocktails/data';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

/**
 * A recipe reduced to what the ingredient page's card list renders. The full
 * Recipe object (about 913 bytes serialized) used to ship in the page payload
 * for every related recipe; the card needs a fraction of that.
 */
export type RecipeCardItem = {
  name: string;
  href: ReturnType<typeof getRecipeUrl>;
  source: string;
  quantity: RecipeIngredient['quantity'] | undefined;
  searchText: string;
};

export function toRecipeCards(
  recipes: Recipe[],
  ingredient: RootIngredient,
): RecipeCardItem[] {
  return recipes.map((recipe) => {
    const matching = recipe.ingredients.find((i) => i.slug === ingredient.slug);

    return {
      name: recipe.name,
      href: getRecipeUrl(recipe),
      source: getRecipeSource(recipe),
      quantity: matching?.quantity,
      searchText: getRecipeSearchText(recipe),
    };
  });
}
