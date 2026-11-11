import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  failJson,
  serveJson,
  sharedJsonServer,
  sharedJsonUrl,
} from '#/testing/sharedJsonServer';
import type { Catalog } from './buildCatalog';
import {
  getCatalogList,
  getLoadedCatalog,
  loadCatalog,
  resetCatalogCache,
} from './catalog';

const catalog: Catalog = {
  cards: {
    '/recipes/book/a/daiquiri': ['Daiquiri', 'Book A'],
    '/recipes/book/a/mai-tai': ['Mai Tai', 'Book A'],
  },
  lists: {
    'category/rum': [
      ['/recipes/book/a/daiquiri', { amount: 2, unit: 'oz' }],
      ['/recipes/book/a/mai-tai', null],
    ],
  },
};

beforeEach(() => {
  resetCatalogCache();
});

describe('loadCatalog', () => {
  it('fetches the static catalog once for concurrent and later callers', async () => {
    const respond = vi.fn(() => HttpResponse.json(catalog));
    sharedJsonServer.use(http.get(sharedJsonUrl('/data/catalog.json'), respond));

    const [first, second] = await Promise.all([loadCatalog(), loadCatalog()]);
    const third = await loadCatalog();

    expect(first).toEqual(catalog);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(respond).toHaveBeenCalledOnce();
    expect(getLoadedCatalog()).toBe(first);
  });

  it('rejects on a failed response and retries on the next call', async () => {
    sharedJsonServer.use(failJson('/data/catalog.json', 500));
    await expect(loadCatalog()).rejects.toThrow('500');

    sharedJsonServer.use(serveJson('/data/catalog.json', catalog));
    await expect(loadCatalog()).resolves.toEqual(catalog);
  });

  it('rejects on a network error and retries on the next call', async () => {
    // HttpResponse.error() is msw's network failure: the fetch itself rejects,
    // no response ever arrives.
    sharedJsonServer.use(
      http.get(sharedJsonUrl('/data/catalog.json'), () => HttpResponse.error()),
    );
    await expect(loadCatalog()).rejects.toThrow();

    sharedJsonServer.use(serveJson('/data/catalog.json', catalog));
    await expect(loadCatalog()).resolves.toEqual(catalog);
  });
});

describe('getCatalogList', () => {
  it('resolves a page list against the catalog cards', () => {
    const [daiquiri, maiTai] = getCatalogList(catalog, 'category/rum');

    expect(daiquiri).toEqual({
      href: '/recipes/book/a/daiquiri',
      name: 'Daiquiri',
      source: 'Book A',
      quantity: { amount: 2, unit: 'oz' },
    });
    // A quantity the data lacked renders as an absent one, not null.
    expect(maiTai?.quantity).toBeUndefined();
  });

  it('renders no rows for a key the catalog does not carry', () => {
    expect(getCatalogList(catalog, 'category/new-page')).toEqual([]);
    expect(getCatalogList(undefined, 'category/rum')).toEqual([]);
  });

  it('skips entries whose card the catalog does not know, never mislabels one', () => {
    const stale: Catalog = {
      cards: { '/recipes/book/a/daiquiri': ['Daiquiri', 'Book A'] },
      lists: {
        'category/rum': [
          ['/recipes/book/a/daiquiri', null],
          ['/recipes/book/b/zombie', null],
        ],
      },
    };

    expect(getCatalogList(stale, 'category/rum')).toEqual([
      {
        href: '/recipes/book/a/daiquiri',
        name: 'Daiquiri',
        source: 'Book A',
        quantity: undefined,
      },
    ]);
  });
});
