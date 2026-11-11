import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import SearchableRecipePage from '#/components/SearchableRecipePage';

export const metadata: Metadata = {
  title: 'Cocktail Index | Non-Alcoholic Recipes',
};

export default async function NonAlcoholicRecipesPage() {
  const recipes = await getNonAlcoholicRecipes();

  return (
    <SearchableRecipePage
      title="Non-Alcoholic Recipes"
      catalogKey={recipes.length > 0 ? 'list/non-alcoholic' : undefined}
      recipeCount={recipes.length}
      listHeader="All Recipes"
    />
  );
}
