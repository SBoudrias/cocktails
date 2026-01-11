import { Metadata } from 'next';
import RecipesClient from './RecipesClient';

export { RecipesClient };
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';

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
