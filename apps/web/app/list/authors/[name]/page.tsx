import { getAuthor } from '@cocktails/data/authors';
import { getBar } from '@cocktails/data/bars';
import { getAllRecipes } from '@cocktails/data/recipes';
import { getSource } from '@cocktails/data/sources';
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

  // The author entity may reference bars (where they worked) and catalog
  // sources (channel host, book author); resolve both for the About card.
  const [bars, sources] = await Promise.all([
    Promise.all((author.bars ?? []).map((slug) => getBar(slug))),
    Promise.all(
      (author.sources ?? []).map((source) => getSource(source.type, source.slug)),
    ),
  ]);

  return (
    <Suspense>
      <AuthorRecipesClient
        author={author}
        bars={bars.filter((bar) => bar !== undefined)}
        sources={sources}
        recipes={authorRecipes}
      />
    </Suspense>
  );
}
