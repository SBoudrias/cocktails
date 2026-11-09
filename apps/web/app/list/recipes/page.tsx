import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { getLetters } from '#/modules/lists/letters';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

export default async function RecipesPage() {
  const recipes = await getAllRecipes();

  return <RecipesClient title="All Recipes" letters={getLetters(recipes)} />;
}
