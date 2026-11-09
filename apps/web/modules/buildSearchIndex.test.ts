import { getAllRecipes } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import { buildSearchIndex, getSerializedSearchIndex } from './buildSearchIndex';
import { toRecipeListItems } from './recipeListItem';

const items = [
  { href: '/recipes/b/zz', name: 'Zed', source: 'Book B', searchText: 'zed gin' },
  { href: '/recipes/a/yy', name: 'Why', source: 'Book A', searchText: 'why rum' },
  { href: '/recipes/b/xx', name: 'Ex', source: 'Book B', searchText: 'ex rye' },
];

describe('buildSearchIndex', () => {
  it('keys entries by href with the fields global search renders and matches on', () => {
    expect(buildSearchIndex(items)['/recipes/a/yy']).toEqual({
      name: 'Why',
      source: 'Book A',
      searchText: 'why rum',
    });
  });

  it('orders keys independently of input order', () => {
    expect(Object.keys(buildSearchIndex(items))).toEqual([
      '/recipes/a/yy',
      '/recipes/b/xx',
      '/recipes/b/zz',
    ]);
    expect(JSON.stringify(buildSearchIndex(items.toReversed()))).toBe(
      JSON.stringify(buildSearchIndex(items)),
    );
  });

  it('orders keys by code unit, not by locale', () => {
    const index = buildSearchIndex(
      ['/b', '/B', '/a', '/_'].map((href) => ({
        href,
        name: href,
        source: '',
        searchText: '',
      })),
    );

    expect(Object.keys(index)).toEqual(['/B', '/_', '/a', '/b']);
  });
});

describe('getSerializedSearchIndex', () => {
  it('covers every recipe and is byte-identical when the input order changes', async () => {
    const recipes = await getAllRecipes();
    const serialized = await getSerializedSearchIndex();
    const shuffled = JSON.stringify(
      buildSearchIndex(toRecipeListItems(recipes.toReversed())),
    );

    expect(serialized).toBe(shuffled);
    expect(Object.keys(JSON.parse(serialized))).toHaveLength(
      new Set(toRecipeListItems(recipes).map((item) => item.href)).size,
    );
  });
});
