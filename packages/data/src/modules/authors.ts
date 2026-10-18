import fs from 'node:fs/promises';
import path from 'node:path';
import type { Author } from '../types/Entity.ts';
import { AUTHOR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

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

export const getAuthor = memo(async (slug: string): Promise<Author | undefined> => {
  return readAuthorFile(slug);
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
