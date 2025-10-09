import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllIngredients } from '@/modules/ingredients';
import { getAllCategories } from '@/modules/categories';
import IngredientsList from './IngredientsList';

export const metadata: Metadata = {
  title: 'Cocktail Index | Ingredient list',
};

export default async function IngredientListPage() {
  const allIngredients = await getAllIngredients();
  const allCategories = await getAllCategories();
  const ingredients = allIngredients.filter((ingredient) => {
    return ingredient.type !== 'liqueur' && ingredient.type !== 'spirit';
  });

  const combinedIngredients = [...ingredients, ...allCategories];

  return (
    <Suspense>
      <AppHeader title="All Ingredients" />
      <IngredientsList ingredients={combinedIngredients} />
    </Suspense>
  );
}
