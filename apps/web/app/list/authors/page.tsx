import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import AuthorsClient from './AuthorsClient';

export const metadata: Metadata = {
  title: 'Indexotica | Authors list',
};

export default async function AuthorListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique authors from recipe attributions
  const authorsMap = new Map<string, { name: string; recipeCount: number }>();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        const authorName = attribution.source;
        const author = authorsMap.get(authorName) || {
          name: authorName,
          recipeCount: 0,
        };

        author.recipeCount += 1;
        authorsMap.set(authorName, author);
      }
    }
  }

  // Convert to array
  const authors = Array.from(authorsMap.values());

  return <AuthorsClient authors={authors} />;
}
