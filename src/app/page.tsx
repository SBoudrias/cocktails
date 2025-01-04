import { Metadata } from 'next';
import Search from './SearchBar';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';

export const metadata: Metadata = {
  title: 'Cocktail Index | Search',
};

export default async function SearchPage() {
  const recipes = await getAllRecipes();

  return (
    <>
      <Suspense>
        <Search recipes={recipes} />
      </Suspense>
    </>
  );
}
