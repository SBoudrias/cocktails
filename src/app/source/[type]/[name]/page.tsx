import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Source } from '@/types/Source';
import { getSourcePageParams } from '@/modules/params';
import { getRecipesFromSource } from '@/modules/recipes';
import { getSource } from '@/modules/sources';
import BookSourceClient from './BookSourceClient';
import SourceClient from './SourceClient';

type Params = { type: Source['type']; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getSourcePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  try {
    const source = await getSource(type, name);

    return {
      title: `Cocktail Index | ${source.name}`,
    };
  } catch {
    notFound();
  }
}

export default async function SourcePage({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  const source = await getSource(type, name);
  const recipes = await getRecipesFromSource(source);

  return (
    <Suspense>
      {source.type === 'book' ? (
        <BookSourceClient source={source} recipes={recipes} />
      ) : (
        <SourceClient source={source} recipes={recipes} />
      )}
    </Suspense>
  );
}
