import type { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import { getRecipeUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import { notFound } from 'next/navigation';
import slugify from '@sindresorhus/slugify';
import type { Recipe } from '@/types/Recipe';

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
  const { name } = await params;
  const allRecipes = await getAllRecipes();
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

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((bar) => {
        params.add(slugify(`${bar.source} ${bar.location ?? ''}`));
      });
  });

  return Array.from(params).map((name) => ({ name }));
}

export default async function BarRecipesPage({ params }: Props) {
  const { name } = await params;
  const allRecipes = await getAllRecipes();
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

  return (
    <Suspense>
      <AppHeader title={`Recipes from ${formatBarName(bar)}`} />
      <List sx={{ mt: 2 }}>
        <Paper square>
          {barRecipes.map((recipe) => (
            <Link href={getRecipeUrl(recipe)} key={recipe.slug}>
              <ListItem divider secondaryAction={<ChevronRight />}>
                <ListItemText primary={recipe.name} />
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
    </Suspense>
  );
}
