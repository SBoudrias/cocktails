import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllIngredients } from '@/modules/ingredients';
import BottlesClient from './BottlesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bottle list',
};

export default async function BottlesPage() {
  const allIngredients = await getAllIngredients();

  const bottles = allIngredients.filter((ingredient) => {
    return ingredient.type === 'liqueur' || ingredient.type === 'spirit';
  });

  return (
    <Suspense>
      <BottlesClient bottles={bottles} />
    </Suspense>
  );
}
