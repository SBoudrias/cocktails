import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { Bar } from '../types/Entity.ts';
import { BAR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';
import { getAllRecipes } from './recipes';

/**
 * Read a bar entity file, keyed by the slug of its name and location
 * (matching the `list/bars/[name]` pages, see getBarRecipesUrl), returning
 * it with its slug. Returns undefined when no file exists — bars are
 * credited in recipes before anything is known about them, and the list
 * pages show recipes with no About card.
 */
async function readBarFile(slug: string): Promise<Bar | undefined> {
  const data = await readJSONFile<Omit<Bar, 'slug'>>(path.join(BAR_ROOT, `${slug}.json`));

  if (!data) return undefined;

  return { ...data, slug };
}

/**
 * Derive a name-only bar from the recipes' attributions. The list pages'
 * fallback when no entity file exists — check-data creates a file for every
 * credited bar, so this only covers files gone missing.
 */
async function findBarFromAttributions(slug: string): Promise<Bar | undefined> {
  const allRecipes = await getAllRecipes();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'bar' &&
        slugify(`${attribution.source} ${attribution.location ?? ''}`) === slug
      ) {
        return {
          name: attribution.source,
          slug,
          ...(attribution.location ? { location: attribution.location } : {}),
        };
      }
    }
  }

  return undefined;
}

export const getBar = memo(async (slug: string): Promise<Bar | undefined> => {
  const bar = await readBarFile(slug);
  return bar ?? findBarFromAttributions(slug);
});

export const getAllBars = memo(async (): Promise<Bar[]> => {
  const bars: Bar[] = [];

  for await (const file of fs.glob('*.json', { cwd: BAR_ROOT })) {
    const bar = await readBarFile(path.basename(file, '.json'));

    if (bar) bars.push(bar);
  }

  bars.sort((a, b) => a.name.localeCompare(b.name));

  return bars;
});
