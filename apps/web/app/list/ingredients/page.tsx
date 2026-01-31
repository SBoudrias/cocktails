import type { Metadata } from 'next';
import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import { Suspense } from 'react';
import IngredientsClient from './IngredientsClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Ingredient list',
};

export default async function IngredientListPage() {
  const allIngredients = await getAllIngredients();
  const allCategories = await getAllCategories();
  const ingredients = allIngredients.filter((ingredient) => {
    return ingredient.type !== 'liqueur' && ingredient.type !== 'spirit';
  });

  return (
    <Suspense>
      <IngredientsClient ingredients={[...ingredients, ...allCategories]} />
    </Suspense>
  );
}
