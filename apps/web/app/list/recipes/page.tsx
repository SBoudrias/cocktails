import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getRecipeListItems } from './recipeListItem';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

export default async function RecipesPage() {
  const recipes = await getAllRecipes();
  const recipeListItems = getRecipeListItems(recipes);

  return (
    <Suspense>
      <RecipesClient recipeListItems={recipeListItems} />
    </Suspense>
  );
}
