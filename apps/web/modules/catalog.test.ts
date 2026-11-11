import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  resetCatalogCache();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { origin: 'https://cocktails.test' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadCatalog', () => {
  it('fetches the static catalog once for concurrent and later callers', async () => {
    fetchMock.mockResolvedValue(Response.json(catalog));

    const [first, second] = await Promise.all([loadCatalog(), loadCatalog()]);
    const third = await loadCatalog();

    expect(first).toEqual(catalog);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cocktails.test/cocktails/data/catalog.json',
    );
    expect(getLoadedCatalog()).toBe(first);
  });

  it('rejects on a failed response and retries on the next call', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    await expect(loadCatalog()).rejects.toThrow('500');

    fetchMock.mockResolvedValueOnce(Response.json(catalog));
    await expect(loadCatalog()).resolves.toEqual(catalog);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('getCatalogList', () => {
  it('resolves a page list against the catalog cards', () => {
    const list = getCatalogList(catalog, 'category/rum');
    expect(list).toBeDefined();

    const [daiquiri, maiTai] = list ?? [];

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
