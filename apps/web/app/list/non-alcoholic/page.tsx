import { getNonAlcoholicRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import { toRecipeListItems } from '#/modules/recipeListItem';

export const metadata: Metadata = {
  title: 'Cocktail Index | Non-Alcoholic Recipes',
};

export default async function NonAlcoholicRecipesPage() {
  const recipes = toRecipeListItems(await getNonAlcoholicRecipes());

  return (
    <SearchableRecipePage
      title="Non-Alcoholic Recipes"
      recipes={recipes}
      listHeader="All Recipes"
    />
  );
}
