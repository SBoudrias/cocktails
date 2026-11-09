import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchHeaderFallback from '#/components/SearchHeader/Fallback';
import { toRecipeListItems } from '#/modules/recipeListItem';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

export default async function RecipesPage() {
  const recipes = await getAllRecipes();

  return (
    <Suspense fallback={<SearchHeaderFallback title="All Recipes" />}>
      <RecipesClient recipes={toRecipeListItems(recipes)} />
    </Suspense>
  );
}
