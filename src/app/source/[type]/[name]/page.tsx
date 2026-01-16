import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import type { Source } from '@/types/Source';
import { getSourcePageParams } from '@/modules/params';
import { getRecipesFromSource } from '@/modules/recipes';
import { getSource } from '@/modules/sources';
import SourceClient from './SourceClient';

type Params = { type: Source['type']; name: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getSourcePageParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { type, name } = await params;

  // Books have their own route
  if (type === 'book') {
    return {};
  }

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

  // Books have their own dedicated route
  if (type === 'book') {
    redirect(`/source/book/${name}`);
  }

  const source = await getSource(type, name);
  const recipes = await getRecipesFromSource(source);

  return (
    <Suspense>
      <SourceClient source={source} recipes={recipes} />
    </Suspense>
  );
}
