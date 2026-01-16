import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SourceAboutCard from '@/components/SourceAboutCard';
import { getBookPageParams } from '@/modules/params';
import { getRecipesFromSource } from '@/modules/recipes';
import { getBook } from '@/modules/sources';
import BookSourceClient from './BookSourceClient';

type Params = { name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getBookPageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { name } = await params;

  try {
    const book = await getBook(name);

    return {
      title: `Cocktail Index | ${book.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function BookSourcePage({ params }: { params: Promise<Params> }) {
  const { name } = await params;

  const book = await getBook(name);
  const recipes = await getRecipesFromSource(book);

  return (
    <Suspense>
      <SourceAboutCard source={book} sx={{ m: 2 }} />
      <BookSourceClient source={book} recipes={recipes} />
    </Suspense>
  );
}
