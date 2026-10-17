import slugify from '@sindresorhus/slugify';
import { describe, expect, it } from 'vitest';
import { getAuthor, getAllAuthors } from './authors.ts';
import { getBar, getAllBars } from './bars.ts';
import { getAllRecipes } from './recipes.ts';

describe('author and bar entities', () => {
  it('resolves every author attribution to an entity file', async () => {
    const allRecipes = await getAllRecipes();

    const authorNames = new Set<string>();
    const barKeys = new Set<string>();

    for (const recipe of allRecipes) {
      for (const attribution of recipe.attributions) {
        if (
          attribution.relation === 'recipe author' ||
          attribution.relation === 'adapted by'
        ) {
          authorNames.add(attribution.source);
        } else if (attribution.relation === 'bar') {
          barKeys.add(slugify(`${attribution.source} ${attribution.location ?? ''}`));
        }
      }
    }

    for (const name of authorNames) {
      const author = await getAuthor(slugify(name));
      expect(author?.name, `missing entity file for "${name}"`).toBe(name);
    }

    for (const key of barKeys) {
      const bar = await getBar(key);
      expect(bar, `missing entity file for "${key}"`).toBeDefined();
    }
  });

  it('lists entities sorted by name, with slugs matching their files', async () => {
    const authors = await getAllAuthors();
    const bars = await getAllBars();

    expect(authors.length).toBeGreaterThan(200);
    expect(bars.length).toBeGreaterThan(100);

    expect(authors.map((author) => author.name)).toEqual(
      authors.map((author) => author.name).toSorted((a, b) => a.localeCompare(b)),
    );
    expect(bars.map((bar) => bar.name)).toEqual(
      bars.map((bar) => bar.name).toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('returns undefined for unknown entities instead of throwing', async () => {
    expect(await getAuthor('no-such-author')).toBeUndefined();
    expect(await getBar('no-such-bar')).toBeUndefined();
  });
});
