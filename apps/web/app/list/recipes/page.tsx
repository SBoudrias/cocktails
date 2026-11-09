import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { byNameListConfig, getNameFirstLetter } from '#/modules/lists/by-name';
import { getLetterSlug, getLetters } from '#/modules/lists/letters';
import { toRecipeListItems } from '#/modules/recipeListItem';
import ProgressiveRecipesClient from './ProgressiveRecipesClient';
import RecipesClient from './RecipesClient';
import VirtuosoRecipesClient from './VirtuosoRecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

// PROTOTYPE (option C): how many rows the static HTML holds, whole letters.
const PRERENDERED_ROWS = 300;

export default async function RecipesPage() {
  const recipes = await getAllRecipes();
  const letters = getLetters(recipes);

  if (process.env.LIST_MODE === 'full') {
    return <RecipesClient recipes={toRecipeListItems(recipes)} letters={letters} />;
  }

  const prerendered = new Set<string>();
  let rows = 0;
  for (const letter of letters) {
    if (rows >= PRERENDERED_ROWS) break;
    prerendered.add(letter.slug);
    rows += letter.count;
  }

  const initialRecipes = toRecipeListItems(
    recipes.filter((recipe) => prerendered.has(getLetterSlug(recipe))),
  )
    .toSorted(byNameListConfig.sortItemBy)
    .toSorted((a, b) =>
      byNameListConfig.sortHeaderBy(getNameFirstLetter(a), getNameFirstLetter(b)),
    )
    .map(({ href, name, source }) => ({ href, name, source }));

  if (process.env.LIST_MODE === 'virtuoso') {
    return <VirtuosoRecipesClient initialRecipes={initialRecipes} letters={letters} />;
  }

  return <ProgressiveRecipesClient initialRecipes={initialRecipes} letters={letters} />;
}
