import type { Recipe } from '@cocktails/data';
import type { Metadata } from 'next';
import { getAllRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AuthorRecipesClient from './AuthorRecipesClient';

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

  if (authorRecipes.length === 0) {
    notFound();
  }

  return (
    <Suspense>
      <AuthorRecipesClient authorName={authorName} recipes={authorRecipes} />
    </Suspense>
  );
}
