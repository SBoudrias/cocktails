import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllIngredients } from '@/modules/ingredients';
import BottlesList from './BottlesList';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bottle list',
};

export default async function BottleListPage() {
  const allIngredients = await getAllIngredients();

  const bottles = allIngredients.filter((ingredient) => {
    return ingredient.type === 'liqueur' || ingredient.type === 'spirit';
  });

  return (
    <Suspense>
      <AppHeader title="All Bottles" />
      <BottlesList bottles={bottles} />
    </Suspense>
  );
}
