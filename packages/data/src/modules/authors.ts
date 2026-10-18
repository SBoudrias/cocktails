import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { Author } from '../types/Entity.ts';
import { AUTHOR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';
import { getAllRecipes } from './recipes';

/**
 * Read an author entity file, returning it with its slug. Returns undefined
 * when no file exists — the list pages show recipes for authors with no file.
 */
async function readAuthorFile(slug: string): Promise<Author | undefined> {
  const data = await readJSONFile<Omit<Author, 'slug'>>(
    path.join(AUTHOR_ROOT, `${slug}.json`),
  );

  if (!data) return undefined;

  return { ...data, slug };
}

/**
 * Derive a name-only author from the recipes' attributions. The list pages'
 * fallback when no entity file exists — check-data creates a file for every
 * credited author, so this only covers files gone missing.
 */
async function findAuthorFromAttributions(slug: string): Promise<Author | undefined> {
  const allRecipes = await getAllRecipes();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        (attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by') &&
        slugify(attribution.source) === slug
      ) {
        return { name: attribution.source, slug };
      }
    }
  }

  return undefined;
}

export const getAuthor = memo(async (slug: string): Promise<Author | undefined> => {
  const author = await readAuthorFile(slug);
  return author ?? findAuthorFromAttributions(slug);
});

export const getAllAuthors = memo(async (): Promise<Author[]> => {
  const authors: Author[] = [];

  for await (const file of fs.glob('*.json', { cwd: AUTHOR_ROOT })) {
    const author = await readAuthorFile(path.basename(file, '.json'));

    if (author) authors.push(author);
  }

  authors.sort((a, b) => a.name.localeCompare(b.name));

  return authors;
});
