import { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import { getRecipeUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import { notFound } from 'next/navigation';
import slugify from '@sindresorhus/slugify';
import { Recipe } from '@/types/Recipe';

// Helper function to find the actual bar name from the slug
function findBarNameFromSlug(slug: string, recipes: Recipe[]): string | null {
  for (const recipe of recipes) {
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar' && slugify(attribution.source) === slug) {
        return attribution.source;
      }
    }
  }
  return null;
}

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const allRecipes = await getAllRecipes();
  const barName = findBarNameFromSlug(name, allRecipes);

  if (!barName) {
    return {
      title: 'Bar Not Found',
    };
  }

  return {
    title: `Cocktail Index | Recipes from ${barName}`,
  };
}

export async function generateStaticParams() {
  const allRecipes = await getAllRecipes();
  const params = new Set<string>();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'bar')
      .forEach((attribution) => {
        params.add(slugify(attribution.source));
      });
  });

  return Array.from(params).map((name) => ({ name }));
}

export default async function BarRecipesPage({ params }: Props) {
  const { name } = await params;
  const allRecipes = await getAllRecipes();
  const barName = findBarNameFromSlug(name, allRecipes);

  if (!barName) {
    notFound();
  }

  // Filter recipes by bar
  const barRecipes = allRecipes.filter((recipe) =>
    recipe.attributions.some(
      (attribution) => attribution.relation === 'bar' && attribution.source === barName,
    ),
  );

  // Sort recipes alphabetically
  const sortedRecipes = barRecipes.sort((a, b) => a.name.localeCompare(b.name));

  if (barRecipes.length === 0) {
    notFound();
  }

  return (
    <Suspense>
      <AppHeader title={`Recipes from ${barName}`} />
      <List sx={{ mt: 2 }}>
        <Paper square>
          {sortedRecipes.map((recipe) => (
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
