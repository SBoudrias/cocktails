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

// The shape on disk: one uniform sources array of typed refs — bars the
// author worked at alongside books/channels/podcasts they are behind. The
// loader splits them back out when resolving.
type AuthorFile = Omit<Author, 'slug' | 'bars' | 'sources'> & {
  sources?: [
    { type: 'bar' | Source['type']; slug: string },
    ...{ type: 'bar' | Source['type']; slug: string }[],
  ];
};

/**
 * Bars the catalog has recipes for. The bar list pages render nothing for a
 * bar with an entity file but no recipe attributions, so an author's
 * 'Worked at' line only shows bars a visitor can actually navigate to.
 */
const getBarSlugsWithRecipes = memo(async (): Promise<Set<string>> => {
  const slugs = new Set<string>();

  for (const recipe of await getAllRecipes()) {
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar') {
        slugs.add(slugify(`${attribution.source} ${attribution.location ?? ''}`));
      }
    }
  }

  return slugs;
});

/**
 * Resolve the file's typed refs into the full entities, so consumers always
 * see the one Author type. check-data guarantees every ref resolves; bars
 * the catalog has no recipes for are dropped rather than linking to an
 * empty page.
 */
async function resolveAuthorRefs(data: AuthorFile & { slug: string }): Promise<Author> {
  const { sources: refs, ...rest } = data;

  const barRefs = refs?.filter((ref) => ref.type === 'bar') ?? [];
  const otherRefs =
    refs?.filter(
      (ref): ref is { type: Source['type']; slug: string } => ref.type !== 'bar',
    ) ?? [];

  const [bars, sources] = await Promise.all([
    barRefs.length > 0
      ? Promise.all([
          getBarSlugsWithRecipes(),
          Promise.all(barRefs.map((ref) => getBar(ref.slug))),
        ]).then(([withRecipes, bars]) =>
          bars.filter(
            (bar): bar is Bar => bar !== undefined && withRecipes.has(bar.slug),
          ),
        )
      : undefined,
    otherRefs.length > 0
      ? Promise.all(otherRefs.map((ref) => getSource(ref.type, ref.slug)))
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
