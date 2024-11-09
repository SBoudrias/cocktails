import { Metadata } from 'next';
import Search from './SearchBar';
import { getAllData } from '@/modules/entities';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Cocktail Index | Search',
};

export default async function SearchPage() {
  const { recipes } = await getAllData();

  return (
    <>
      <Suspense>
        <Search recipes={recipes} />
      </Suspense>
    </>
  );
}
