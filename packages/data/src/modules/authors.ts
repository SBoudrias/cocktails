import fs from 'node:fs/promises';
import path from 'node:path';
import type { Author } from '../types/Entity.ts';
import { AUTHOR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

async function readAuthorFile(slug: string): Promise<Omit<Author, 'slug'> | undefined> {
  return readJSONFile<Omit<Author, 'slug'>>(path.join(AUTHOR_ROOT, `${slug}.json`));
}

/**
 * Get an author entity by the slug of its name. Returns undefined when no
 * entity file exists — the list pages show recipes for authors with no file.
 */
export const getAuthor = memo(async (slug: string): Promise<Author | undefined> => {
  const data = await readAuthorFile(slug);

  if (!data) return undefined;

  return { ...data, slug };
});

export const getAllAuthors = memo(async (): Promise<Author[]> => {
  const authors: Author[] = [];

  for await (const file of fs.glob('*.json', { cwd: AUTHOR_ROOT })) {
    const data = await readJSONFile<Omit<Author, 'slug'>>(path.join(AUTHOR_ROOT, file));

    if (!data) continue;

    authors.push({ ...data, slug: path.basename(file, '.json') });
  }

  authors.sort((a, b) => a.name.localeCompare(b.name));

  return authors;
});
