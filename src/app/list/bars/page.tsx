import { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import BarsList from './BarsList';

export const metadata: Metadata = {
  title: 'Cocktail Index | Bars list',
};

export default async function BarListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique bars from recipe attributions
  const barsMap = new Map<
    string,
    { name: string; location?: string; recipeCount: number }
  >();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((attribution) => {
        const mapKey = `${attribution.source}${attribution.location ?? ''}`;
        const bar = barsMap.get(mapKey) || {
          name: attribution.source,
          location: attribution.location,
          recipeCount: 0,
        };
        bar.recipeCount += 1;
        barsMap.set(mapKey, bar);
      });
  });

  // Convert to array
  const bars = Array.from(barsMap.values());

  return (
    <Suspense>
      <AppHeader title="All Bars" />
      <BarsList bars={bars} />
    </Suspense>
  );
}
