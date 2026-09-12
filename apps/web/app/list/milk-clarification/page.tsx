import { getMilkClarifiedRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import MilkClarificationRecipesClient from './MilkClarificationRecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Milk-Clarified Recipes',
};

export default async function MilkClarificationRecipesPage() {
  const recipes = await getMilkClarifiedRecipes();

  return (
    <Suspense>
      <MilkClarificationRecipesClient recipes={recipes} />
    </Suspense>
  );
}
