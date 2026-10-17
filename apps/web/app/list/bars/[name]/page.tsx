import type { Recipe } from '@cocktails/data';
import { getBar } from '@cocktails/data/bars';
import { getAllRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import BarRecipesClient from './BarRecipesClient';

// Helper function to find the actual bar name from the slug
function findBarNameFromSlug(
  slug: string,
  recipes: Recipe[],
): { name: string; location?: string } | null {
  for (const recipe of recipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'bar' &&
        slugify(attribution.source + (attribution.location ?? '')) === slug
      ) {
        return {
          name: attribution.source,
          location: attribution.location,
        };
      }
    }
  }

  return null;
}

function formatBarName(bar: { name: string; location?: string }) {
  return `${bar.name}${bar.location ? `, ${bar.location}` : ''}`;
}

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ name }, allRecipes] = await Promise.all([params, getAllRecipes()]);
  const bar = findBarNameFromSlug(name, allRecipes);

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
  const [{ name }, allRecipes] = await Promise.all([params, getAllRecipes()]);
  const bar = findBarNameFromSlug(name, allRecipes);

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

  const barEntity = await getBar(slugify(`${bar.name} ${bar.location ?? ''}`));

  return (
    <Suspense>
      <BarRecipesClient
        barName={formatBarName(bar)}
        bar={barEntity}
        recipes={barRecipes}
      />
    </Suspense>
  );
}
