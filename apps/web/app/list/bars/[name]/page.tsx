import { getBar } from '@cocktails/data/bars';
import { getAllRecipes, getRecipesByBar } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BarAboutCard } from '#/components/EntityAboutCard';
import SearchableRecipePage from '#/components/SearchableRecipePage';

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
    title: `Indexotica | Recipes from ${formatBarName(bar)}`,
    description: bar.description ?? `Cocktail recipes from ${formatBarName(bar)}.`,
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
  const bar = await getBar(name);

  // getBar falls back to the recipes' attributions when the entity file is
  // missing, so no match means no bar by that slug is credited anywhere.
  if (!bar) {
    notFound();
  }

  // Filter recipes by bar
  const barRecipes = await getRecipesByBar(bar);

  if (barRecipes.length === 0) {
    notFound();
  }

  return (
    <SearchableRecipePage
      catalogKey={`list/bars/${bar.slug}`}
      recipeCount={barRecipes.length}
      listHeader={`Recipes from ${bar.name}`}
    >
      <BarAboutCard bar={bar} sx={{ m: 2 }} />
    </SearchableRecipePage>
  );
}
