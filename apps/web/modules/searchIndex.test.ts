import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  resetSearchIndexCache();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { origin: 'https://cocktails.test' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadSearchIndex', () => {
  it('fetches the static index once for concurrent and later callers', async () => {
    fetchMock.mockResolvedValue(Response.json(index));

    const [first, second] = await Promise.all([loadSearchIndex(), loadSearchIndex()]);
    const third = await loadSearchIndex();

    expect(first).toEqual(index);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cocktails.test/cocktails/data/search-index.json',
    );
  });

  it('rejects on a failed response and retries on the next call', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    await expect(loadSearchIndex()).rejects.toThrow('500');

    fetchMock.mockResolvedValueOnce(Response.json(index));
    await expect(loadSearchIndex()).resolves.toEqual(index);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('hands a loaded index back synchronously', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    expect(getLoadedSearchIndex()).toBeUndefined();

    const pending = loadSearchIndex();
    expect(getLoadedSearchIndex()).toBeUndefined();
    const loaded = await pending;
    expect(getLoadedSearchIndex()).toBe(loaded);

    resetSearchIndexCache();
    expect(getLoadedSearchIndex()).toBeUndefined();
  });

  it('retries after a network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(loadSearchIndex()).rejects.toThrow('offline');

    fetchMock.mockResolvedValueOnce(Response.json(index));
    await expect(loadSearchIndex()).resolves.toEqual(index);
  });
});

describe('preloadSearchIndex', () => {
  it('starts the fetch that loadSearchIndex then reuses', async () => {
    fetchMock.mockResolvedValue(Response.json(index));

    preloadSearchIndex();
    await loadSearchIndex();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not throw an unhandled rejection when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));

    expect(() => preloadSearchIndex()).not.toThrow();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
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
