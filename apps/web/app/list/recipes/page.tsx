import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { toRecipeListItems } from '#/modules/recipeListItem';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | All Recipes',
};

export default async function RecipesPage() {
  const recipes = await getAllRecipes();

  return <RecipesClient recipes={toRecipeListItems(recipes)} />;
}
