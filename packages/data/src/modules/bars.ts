import fs from 'node:fs/promises';
import path from 'node:path';
import type { Bar } from '../types/Entity.ts';
import { BAR_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

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

export const getBar = memo(async (slug: string): Promise<Bar | undefined> => {
  return readBarFile(slug);
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
