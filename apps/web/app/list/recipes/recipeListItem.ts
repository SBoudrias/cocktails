import type { Recipe } from '@cocktails/data';
import { match } from 'ts-pattern';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

export type RecipeListItem = {
  name: string;
  href: string;
  secondary: string;
  searchText: string;
};

function getRecipeSource(recipe: Recipe): string {
  return match(recipe.source)
    .with({ type: 'book' }, ({ name }) =>
      [name, recipe.chapter?.name].filter(Boolean).join(' · '),
    )
    .with({ type: 'youtube-channel' }, ({ name }) => name)
    .with({ type: 'podcast' }, ({ name }) => name)
    .exhaustive();
}

export function getRecipeListItems(recipes: Recipe[]): RecipeListItem[] {
  return recipes.map((recipe) => ({
    name: recipe.name,
    href: getRecipeUrl(recipe),
    secondary: getRecipeSource(recipe),
    searchText: getRecipeSearchText(recipe),
  }));
}
