import { http, HttpResponse } from 'msw';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  failJson,
  serveJson,
  sharedJsonServer,
  sharedJsonUrl,
} from '#/testing/sharedJsonServer';
import type { SearchIndex } from './buildSearchIndex';
import {
  getIndexedSearchText,
  getLoadedSearchIndex,
  loadSearchIndex,
  preloadSearchIndex,
  resetSearchIndexCache,
} from './searchIndex';

const index: SearchIndex = {
  '/recipes/a/daiquiri': {
    name: 'Daiquiri',
    source: 'Book A',
    searchText: 'daiquiri white rum lime',
  },
};

beforeAll(() => sharedJsonServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => sharedJsonServer.close());

beforeEach(() => {
  resetSearchIndexCache();
  vi.stubGlobal('location', { origin: 'https://cocktails.test' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  sharedJsonServer.resetHandlers();
});

describe('loadSearchIndex', () => {
  it('fetches the static index once for concurrent and later callers', async () => {
    const respond = vi.fn(() => HttpResponse.json(index));
    sharedJsonServer.use(http.get(sharedJsonUrl('/data/search-index.json'), respond));

    const [first, second] = await Promise.all([loadSearchIndex(), loadSearchIndex()]);
    const third = await loadSearchIndex();

    expect(first).toEqual(index);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(respond).toHaveBeenCalledOnce();
  });

  it('rejects on a failed response and retries on the next call', async () => {
    sharedJsonServer.use(failJson('/data/search-index.json', 500));
    await expect(loadSearchIndex()).rejects.toThrow('500');

    sharedJsonServer.use(serveJson('/data/search-index.json', index));
    await expect(loadSearchIndex()).resolves.toEqual(index);
  });

  it('hands a loaded index back synchronously', async () => {
    sharedJsonServer.use(serveJson('/data/search-index.json', index));
    expect(getLoadedSearchIndex()).toBeUndefined();

    const pending = loadSearchIndex();
    expect(getLoadedSearchIndex()).toBeUndefined();
    const loaded = await pending;
    expect(getLoadedSearchIndex()).toBe(loaded);

    resetSearchIndexCache();
    expect(getLoadedSearchIndex()).toBeUndefined();
  });

  it('retries after a network error', async () => {
    sharedJsonServer.use(
      http.get(sharedJsonUrl('/data/search-index.json'), () => HttpResponse.error()),
    );
    await expect(loadSearchIndex()).rejects.toThrow();

    sharedJsonServer.use(serveJson('/data/search-index.json', index));
    await expect(loadSearchIndex()).resolves.toEqual(index);
  });
});

describe('preloadSearchIndex', () => {
  it('starts the fetch that loadSearchIndex then reuses', async () => {
    const respond = vi.fn(() => HttpResponse.json(index));
    sharedJsonServer.use(http.get(sharedJsonUrl('/data/search-index.json'), respond));

    preloadSearchIndex();
    await loadSearchIndex();

    expect(respond).toHaveBeenCalledOnce();
  });

  it('does not throw an unhandled rejection when the fetch fails', async () => {
    const requests: unknown[] = [];
    sharedJsonServer.use(
      http.get(sharedJsonUrl('/data/search-index.json'), () => {
        requests.push(null);
        return HttpResponse.error();
      }),
    );

    expect(() => preloadSearchIndex()).not.toThrow();
    await vi.waitFor(() => expect(requests).toHaveLength(1));
  });
});

describe('getIndexedSearchText', () => {
  const items = [
    { href: '/recipes/a/daiquiri', name: 'Daiquiri' },
    { href: '/recipes/a/Unknown', name: 'Unknown Sour' },
  ];

  it('returns the indexed search text, or the name for an unknown href', () => {
    expect(items.map((item) => getIndexedSearchText(item, index))).toEqual([
      'daiquiri white rum lime',
      'unknown sour',
    ]);
  });

  it('falls back to the lowercased name while the index is not loaded', () => {
    expect(items.map((item) => getIndexedSearchText(item, undefined))).toEqual([
      'daiquiri',
      'unknown sour',
    ]);
  });
});
