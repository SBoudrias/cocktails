import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Cocktail Index | Search',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const searchValue = (await searchParams).search;
  const search = Array.isArray(searchValue) ? searchValue[0] : searchValue;

  return redirect(
    search ? `/list/recipes?search=${encodeURIComponent(search)}` : '/list/recipes',
  );
}
