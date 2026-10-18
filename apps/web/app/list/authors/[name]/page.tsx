import { getAuthor } from '@cocktails/data/authors';
import { getAllRecipes } from '@cocktails/data/recipes';
import slugify from '@sindresorhus/slugify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AuthorRecipesClient from './AuthorRecipesClient';

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const author = await getAuthor(name);

  if (!author) {
    return {
      title: 'Author Not Found',
    };
  }

  return {
    title: `Cocktail Index | Recipes by ${author.name}`,
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
  const [allRecipes, author] = await Promise.all([getAllRecipes(), getAuthor(name)]);

  // getAuthor falls back to the recipes' attributions when the entity file is
  // missing, so no match means no author by that slug is credited anywhere.
  if (!author) {
    notFound();
  }

  // Filter recipes by author
  const authorRecipes = allRecipes.filter((recipe) =>
    recipe.attributions.some(
      (attribution) =>
        (attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by') &&
        attribution.source === author.name,
    ),
  );

  if (authorRecipes.length === 0) {
    notFound();
  }

  // getAuthor resolves the entity's bars/sources refs into full entities, so
  // the client renders every dimension of the author from its one object.
  return (
    <Suspense>
      <AuthorRecipesClient author={author} recipes={authorRecipes} />
    </Suspense>
  );
}
