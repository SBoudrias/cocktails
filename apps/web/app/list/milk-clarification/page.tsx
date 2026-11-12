import { getMilkClarifiedRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import SearchableRecipePage from '#/components/SearchableRecipePage';
import { toRecipeListItems } from '#/modules/recipeListItem';

export const metadata: Metadata = {
  title: 'Indexotica | Milk-Clarified Recipes',
};

export default async function MilkClarificationRecipesPage() {
  const recipes = toRecipeListItems(await getMilkClarifiedRecipes());

  return (
    <SearchableRecipePage
      title="Milk-Clarified Recipes"
      recipes={recipes}
      listHeader="All Recipes"
    />
  );
}
