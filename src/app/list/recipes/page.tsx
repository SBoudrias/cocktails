import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

export default async function RecipesPage() {
  const recipes = await getAllRecipes();

  return (
    <Suspense>
      <RecipesClient recipes={recipes} />
    </Suspense>
  );
}
