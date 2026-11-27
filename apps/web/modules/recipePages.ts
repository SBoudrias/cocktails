import type { Recipe } from '@cocktails/data';
import type { RecipePagesFile } from '#/modules/buildRecipePages';
import { createSharedJson } from '#/modules/sharedJson';

export const { load: loadRecipePages, getLoaded: getLoadedRecipePages } =
  createSharedJson<RecipePagesFile>('data/recipes.json');

/**
 * A recipe page's recipe out of the file: its ingredient lines and source
 * resolved against the shared tables. Undefined when a table misses an
 * entry the page names (a file that is not this build's).
 */
export function resolveRecipe(
  { recipe }: RecipePagesFile['pages'][string],
  file: RecipePagesFile,
): Recipe | undefined {
  const source = file.sources[recipe.source];
  const ingredients = recipe.ingredients.flatMap(([key, use]) => {
    const ingredient = file.ingredients[key];
    return ingredient ? [{ ...ingredient, ...use }] : [];
  });
  if (source == null || ingredients.length !== recipe.ingredients.length) {
    return undefined;
  }

  return { ...recipe, source, ingredients };
}
