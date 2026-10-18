import { getBar } from '@cocktails/data/bars';
import { getAllRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import BarRecipesClient from './BarRecipesClient';

function formatBarName(bar: { name: string; location?: string }) {
  return `${bar.name}${bar.location ? `, ${bar.location}` : ''}`;
}

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const bar = await getBar(name);

  if (!bar) {
    return {
      title: 'Bar Not Found',
    };
  }

  return {
    title: `Cocktail Index | Recipes from ${formatBarName(bar)}`,
  };
}

export async function generateStaticParams() {
  const allRecipes = await getAllRecipes();
  const params = new Set<string>();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar') {
        params.add(slugify(`${attribution.source} ${attribution.location ?? ''}`));
      }
    }
  }

  return Array.from(params).map((name) => ({ name }));
}

export default async function BarRecipesPage({ params }: Props) {
  const { name } = await params;
  const [allRecipes, bar] = await Promise.all([getAllRecipes(), getBar(name)]);

  // getBar falls back to the recipes' attributions when the entity file is
  // missing, so no match means no bar by that slug is credited anywhere.
  if (!bar) {
    notFound();
  }

  // Filter recipes by bar
  const barRecipes = allRecipes.filter((recipe) =>
    recipe.attributions.some(
      (attribution) =>
        attribution.relation === 'bar' &&
        attribution.source === bar.name &&
        attribution.location === bar.location,
    ),
  );

  if (barRecipes.length === 0) {
    notFound();
  }

  return (
    <Suspense>
      <BarRecipesClient bar={bar} recipes={barRecipes} />
    </Suspense>
  );
}
