import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { toRecipeCards } from '#/modules/recipeCard';
import NonAlcoholicRecipesClient from './NonAlcoholicRecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Non-Alcoholic Recipes',
};

export default async function NonAlcoholicRecipesPage() {
  const recipes = toRecipeCards(await getNonAlcoholicRecipes());

  return (
    <Suspense>
      <NonAlcoholicRecipesClient recipes={recipes} />
    </Suspense>
  );
}
