import type { Recipe } from '@cocktails/data';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

export type RecipeListItem = {
  name: string;
  href: ReturnType<typeof getRecipeUrl>;
  source: string;
  searchText: string;
};

export function getRecipeListItems(recipes: Recipe[]): RecipeListItem[] {
  return recipes.map((recipe) => ({
    name: recipe.name,
    href: getRecipeUrl(recipe),
    source: getRecipeSource(recipe),
    searchText: getRecipeSearchText(recipe),
  }));
}
