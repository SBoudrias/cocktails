import { getAllRecipes } from '@cocktails/data/recipes';
import { describe, expect, it } from 'vitest';
import {
  buildSearchIndex,
  getSerializedSearchIndex,
  toSearchIndexEntityItems,
  toSearchIndexItems,
} from './buildSearchIndex';

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

  it('keys entity entries alongside recipes, keeping only their own fields', () => {
    const index = buildSearchIndex([
      ...items,
      { href: '/category/gin', name: 'Gin', kind: 'category', searchText: 'gin' },
    ]);

    expect(index['/category/gin']).toEqual({
      name: 'Gin',
      kind: 'category',
      searchText: 'gin',
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

describe('toSearchIndexEntityItems', () => {
  it('carries every entity kind, keyed by its page href', async () => {
    const recipes = await getAllRecipes();
    const entities = await toSearchIndexEntityItems(recipes);
    const kinds = Object.groupBy(entities, (entity) => entity.kind);

    // The catalog has all of these — the assertions also pin the href shape
    // per kind to the page routes they link to.
    expect(Object.keys(kinds).toSorted()).toEqual([
      'author',
      'bar',
      'book',
      'category',
      'ingredient',
      'podcast',
      'youtube-channel',
    ]);
    expect(entities.map((entity) => entity.href)).toSatisfy((hrefs: string[]) =>
      hrefs.every((href) =>
        /^\/(category|ingredient|list\/authors|list\/bars|source)\//.test(href),
      ),
    );
  });

  it('derives authors and bars from attributions, deduplicated per page', async () => {
    const entities = await toSearchIndexEntityItems([
      {
        name: 'R1',
        slug: 'r1',
        source: {
          type: 'book',
          name: 'S',
          slug: 's',
          link: '',
          description: '',
          recipeAmount: 1,
        },
        attributions: [
          { relation: 'recipe author', source: 'Jeff Berry' },
          { relation: 'recipe author', source: 'Jeff Berry' },
          { relation: 'bar', source: 'Smuggler', location: 'San Francisco' },
        ],
        ingredients: [],
        preparation: 'shaken',
        served_on: 'up',
        glassware: 'coupe',
        refs: [],
      },
    ]);

    const names = entities
      .filter((entity) => entity.kind === 'author' || entity.kind === 'bar')
      .map((entity) => entity.name);
    expect(names).toContain('Jeff Berry');
    expect(names.filter((name) => name === 'Jeff Berry')).toHaveLength(1);
    expect(entities).toContainEqual({
      href: '/list/bars/smuggler-san-francisco',
      name: 'Smuggler',
      kind: 'bar',
      searchText: 'smuggler san francisco',
    });
  });
});

describe('getSerializedSearchIndex', () => {
  it('covers every recipe and entity, and is byte-identical when the input order changes', async () => {
    const recipes = await getAllRecipes();
    const [recipeItems, entityItems] = await Promise.all([
      toSearchIndexItems(recipes),
      toSearchIndexEntityItems(recipes),
    ]);
    const allItems = [...recipeItems, ...entityItems];
    const serialized = await getSerializedSearchIndex();

    expect(JSON.stringify(buildSearchIndex(allItems.toReversed()))).toBe(serialized);
    expect(Object.keys(JSON.parse(serialized))).toHaveLength(
      new Set(allItems.map((item) => item.href)).size,
    );
  });
});
