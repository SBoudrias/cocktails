import type { Metadata } from 'next';
import { getAllRecipes } from '@cocktails/data';
import { Suspense } from 'react';
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
