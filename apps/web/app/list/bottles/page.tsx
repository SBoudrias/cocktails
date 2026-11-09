import { getAllIngredients } from '@cocktails/data/ingredients';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchHeaderFallback from '#/components/SearchHeader/Fallback';
import BottlesClient from './BottlesClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bottle list',
};

export default async function BottlesPage() {
  const allIngredients = await getAllIngredients();

  const bottles = allIngredients.filter((ingredient) => {
    return (
      ingredient.type === 'liqueur' ||
      ingredient.type === 'spirit' ||
      ingredient.type === 'non-alcoholic'
    );
  });

  return (
    <Suspense fallback={<SearchHeaderFallback title="All Bottles" />}>
      <BottlesClient bottles={bottles} />
    </Suspense>
  );
}
