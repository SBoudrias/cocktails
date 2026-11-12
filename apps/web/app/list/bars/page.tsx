import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import BarsClient from './BarsClient';

export const metadata: Metadata = {
  title: 'Indexotica | Bars list',
};

export default async function BarListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique bars from recipe attributions
  const barsMap = new Map<
    string,
    { name: string; location?: string; recipeCount: number }
  >();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar') {
        const mapKey = `${attribution.source}${attribution.location ?? ''}`;
        const bar = barsMap.get(mapKey) || {
          name: attribution.source,
          location: attribution.location,
          recipeCount: 0,
        };
        bar.recipeCount += 1;
        barsMap.set(mapKey, bar);
      }
    }
  }

  // Convert to array and sort
  const bars = Array.from(barsMap.values()).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );

  return <BarsClient bars={bars} />;
}
