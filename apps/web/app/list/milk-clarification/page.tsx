import { getMilkClarifiedRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchHeaderFallback from '#/components/SearchHeader/Fallback';
import { toRecipeListItems } from '#/modules/recipeListItem';
import MilkClarificationRecipesClient from './MilkClarificationRecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Milk-Clarified Recipes',
};

export default async function MilkClarificationRecipesPage() {
  const recipes = toRecipeListItems(await getMilkClarifiedRecipes());

  return (
    <Suspense fallback={<SearchHeaderFallback title="Milk-Clarified Recipes" />}>
      <MilkClarificationRecipesClient recipes={recipes} />
    </Suspense>
  );
}
