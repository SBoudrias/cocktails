import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchHeaderFallback from '#/components/SearchHeader/Fallback';
import { toRecipeListItems } from '#/modules/recipeListItem';
import NonAlcoholicRecipesClient from './NonAlcoholicRecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Non-Alcoholic Recipes',
};

export default async function NonAlcoholicRecipesPage() {
  const recipes = toRecipeListItems(await getNonAlcoholicRecipes());

  return (
    <Suspense fallback={<SearchHeaderFallback title="Non-Alcoholic Recipes" />}>
      <NonAlcoholicRecipesClient recipes={recipes} />
    </Suspense>
  );
}
