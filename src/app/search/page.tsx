import { Metadata } from 'next';
import Search from './SearchBar';
import { getAllData } from '@/modules/entities';

export const metadata: Metadata = {
  title: 'Cocktail Index | Search',
};

export default async function SearchPage() {
  const { books, recipes } = await getAllData();

  return (
    <>
      <Search books={books} recipes={recipes} />
    </>
  );
}
