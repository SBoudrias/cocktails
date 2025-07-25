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

// Helper function to find the actual author name from the slug
function findAuthorNameFromSlug(slug: string, recipes: Recipe[]): string | null {
  for (const recipe of recipes) {
    for (const attribution of recipe.attributions) {
      if (
        (attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by') &&
        slugify(attribution.source) === slug
      ) {
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
  const authorName = findAuthorNameFromSlug(name, allRecipes);

  if (!authorName) {
    return {
      title: 'Author Not Found',
    };
  }

  return {
    title: `Cocktail Index | Recipes by ${authorName}`,
  };
}

export async function generateStaticParams() {
  const allRecipes = await getAllRecipes();
  const params = new Set<string>();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter(
        (attribution) =>
          attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by',
      )
      .forEach((attribution) => {
        params.add(slugify(attribution.source));
      });
  });

  return Array.from(params).map((name) => ({ name }));
}

export default async function AuthorRecipesPage({ params }: Props) {
  const { name } = await params;
  const allRecipes = await getAllRecipes();
  const authorName = findAuthorNameFromSlug(name, allRecipes);

  if (!authorName) {
    notFound();
  }

  // Filter recipes by author
  const authorRecipes = allRecipes.filter((recipe) =>
    recipe.attributions.some(
      (attribution) =>
        (attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by') &&
        attribution.source === authorName,
    ),
  );

  // Sort recipes alphabetically
  const sortedRecipes = authorRecipes.sort((a, b) => a.name.localeCompare(b.name));

  if (authorRecipes.length === 0) {
    notFound();
  }

  return (
    <Suspense>
      <AppHeader title={`Recipes by ${authorName}`} />
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
