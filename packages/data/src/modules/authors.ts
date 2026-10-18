import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { Author, Bar } from '../types/Entity.ts';
import type { Source } from '../types/Source.ts';
import { getBar } from './bars';
import { AUTHOR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';
import { getAllRecipes } from './recipes';
import { getSource } from './sources';

// The shape on disk: bars and sources are slug refs, resolved to full
// entities by getAuthor before anything consumes them.
type AuthorFile = Omit<Author, 'slug' | 'bars' | 'sources'> & {
  bars?: [string, ...string[]];
  sources?: [
    { type: Source['type']; slug: string },
    ...{ type: Source['type']; slug: string }[],
  ];
};

/**
 * Resolve the file's bars/sources refs into the full entities, so consumers
 * always see the one Author type. check-data guarantees every ref resolves,
 * but a missing entity is skipped rather than crashing the page.
 */
async function resolveAuthorRefs(data: AuthorFile & { slug: string }): Promise<Author> {
  const { bars: barRefs, sources: sourceRefs, ...rest } = data;

  const [bars, sources] = await Promise.all([
    barRefs
      ? Promise.all(barRefs.map((slug) => getBar(slug))).then((bars) =>
          bars.filter((bar): bar is Bar => bar !== undefined),
        )
      : undefined,
    sourceRefs
      ? Promise.all(sourceRefs.map((ref) => getSource(ref.type, ref.slug)))
      : undefined,
  ]);

  return {
    ...rest,
    ...(bars && bars.length > 0 ? { bars } : {}),
    ...(sources ? { sources } : {}),
  };
}

async function readAuthorFile(slug: string): Promise<Author | undefined> {
  const data = await readJSONFile<AuthorFile>(path.join(AUTHOR_ROOT, `${slug}.json`));

  if (!data) return undefined;

  return resolveAuthorRefs({ ...data, slug });
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
