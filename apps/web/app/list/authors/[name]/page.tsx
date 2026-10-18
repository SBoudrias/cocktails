import type { Author, Recipe } from '@cocktails/data';
import { getAuthor } from '@cocktails/data/authors';
import { getAllRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
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
  const [allRecipes, authorEntity] = await Promise.all([
    getAllRecipes(),
    getAuthor(name),
  ]);
  const authorName = authorEntity?.name ?? findAuthorNameFromSlug(name, allRecipes);

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

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        params.add(slugify(attribution.source));
      }
    }
  }

  return Array.from(params).map((name) => ({ name }));
}

export default async function AuthorRecipesPage({ params }: Props) {
  const { name } = await params;
  const [allRecipes, authorEntity] = await Promise.all([
    getAllRecipes(),
    getAuthor(name),
  ]);

  // Entity files exist for every author credited in a recipe (check-data
  // creates them), so the load normally resolves. If a file is ever missing,
  // fall back to the attribution scan so the recipes still render.
  const authorName = authorEntity?.name ?? findAuthorNameFromSlug(name, allRecipes);

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

  const author: Author = authorEntity ?? { name: authorName, slug: name };

  return (
    <Suspense>
      <AuthorRecipesClient author={author} recipes={authorRecipes} />
    </Suspense>
  );
}
