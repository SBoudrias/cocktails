import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthorsClient from './AuthorsClient';

export const metadata: Metadata = {
  title: 'Cocktail Index | Authors list',
};

export default async function AuthorListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique authors from recipe attributions
  const authorsMap = new Map<string, { name: string; recipeCount: number }>();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter(
        (attribution) =>
          attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by',
      )
      .forEach((attribution) => {
        const authorName = attribution.source;
        const author = authorsMap.get(authorName) || {
          name: authorName,
          recipeCount: 0,
        };

        author.recipeCount += 1;
        authorsMap.set(authorName, author);
      });
  });

  // Convert to array
  const authors = Array.from(authorsMap.values());

  return (
    <Suspense>
      <AuthorsClient authors={authors} />
    </Suspense>
  );
}
