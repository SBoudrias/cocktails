import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { getLetterSlug, getLetters } from '#/modules/lists/letters';
import { toRecipeListItems } from '#/modules/recipeListItem';
import ProgressiveRecipesClient from './ProgressiveRecipesClient';
import RecipesClient from './RecipesClient';

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

  return (
    <ProgressiveRecipesClient
      initialRecipes={toRecipeListItems(
        recipes.filter((recipe) => prerendered.has(getLetterSlug(recipe))),
      ).map(({ href, name, source }) => ({ href, name, source }))}
      letters={letters}
    />
  );
}
