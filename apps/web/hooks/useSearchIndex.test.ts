import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchIndex } from '#/modules/buildSearchIndex';
import { preloadSearchIndex, resetSearchIndexCache } from '#/modules/searchIndex';
import { failJson, sharedJsonServer, sharedJsonUrl } from '#/testing/sharedJsonServer';
import { useSearchIndex } from './useSearchIndex';

const index: SearchIndex = {
  '/recipes/a/daiquiri': {
    name: 'Daiquiri',
    source: 'Book A',
    searchText: 'daiquiri white rum lime',
  },
};

const requestIdleCallbackMock = vi.fn<(callback: () => void) => number>();
const cancelIdleCallbackMock = vi.fn<(handle: number) => void>();

/** Run the callback the hook handed to requestIdleCallback, as the browser would. */
function runIdle() {
  const callback = requestIdleCallbackMock.mock.lastCall?.[0];
  if (callback == null) throw new Error('no idle callback was scheduled');
  act(() => callback());
}

/** How many search-index requests the server has handled. */
const indexRequests: unknown[] = [];

/** Serve the fixture from the shared search-index route. */
function serveIndex() {
  sharedJsonServer.use(
    http.get(sharedJsonUrl('/data/search-index.json'), () => {
      indexRequests.push(null);
      return HttpResponse.json(index);
    }),
  );
}

beforeEach(() => {
  resetSearchIndexCache();
  indexRequests.length = 0;
  requestIdleCallbackMock.mockReturnValue(7);
  vi.stubGlobal('requestIdleCallback', requestIdleCallbackMock);
  vi.stubGlobal('cancelIdleCallback', cancelIdleCallbackMock);
});

afterEach(() => {
  // Unmount while the idle-callback stubs still exist; the hook cancels on unmount.
  cleanup();
  vi.unstubAllGlobals();
});

describe('useSearchIndex', () => {
  it('stays undefined and does not fetch until the browser is idle', () => {
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));

    expect(result.current).toBeUndefined();
    expect(requestIdleCallbackMock).toHaveBeenCalledOnce();
    expect(indexRequests).toHaveLength(0);
  });

  it('fetches when idle and returns the index', async () => {
    serveIndex();
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));

    runIdle();

    await waitFor(() => expect(result.current).toEqual(index));
    expect(indexRequests).toHaveLength(1);
  });

  it('fetches right away, without waiting for idle, when urgent', async () => {
    serveIndex();
    const { result } = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(result.current).toEqual(index));
    expect(requestIdleCallbackMock).not.toHaveBeenCalled();
  });

  it('reuses a fetch already started by a search box focus', async () => {
    serveIndex();
    preloadSearchIndex();
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));

    runIdle();

    await waitFor(() => expect(result.current).toEqual(index));
    expect(indexRequests).toHaveLength(1);
  });

  it('shares one fetch across mounts', async () => {
    serveIndex();
    const first = renderHook(() => useSearchIndex({ urgent: true }));
    await waitFor(() => expect(first.result.current).toEqual(index));
    first.unmount();

    const second = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(second.result.current).toEqual(index));
    expect(indexRequests).toHaveLength(1);
  });

  it('switches to an immediate fetch when a search becomes active', async () => {
    serveIndex();
    const { result, rerender } = renderHook(({ urgent }) => useSearchIndex({ urgent }), {
      initialProps: { urgent: false },
    });

    rerender({ urgent: true });

    await waitFor(() => expect(result.current).toEqual(index));
    expect(cancelIdleCallbackMock).toHaveBeenCalledWith(7);
  });

  it('cancels the idle callback on unmount', () => {
    serveIndex();
    const { unmount } = renderHook(() => useSearchIndex({ urgent: false }));

    unmount();

    expect(cancelIdleCallbackMock).toHaveBeenCalledWith(7);
    expect(indexRequests).toHaveLength(0);
  });

  it('stays undefined when the fetch fails, then recovers on the next mount', async () => {
    sharedJsonServer.use(failJson('/data/search-index.json', 500));
    const failed = renderHook(() => useSearchIndex({ urgent: true }));
    await act(async () => {});
    expect(failed.result.current).toBeUndefined();
    failed.unmount();

    serveIndex();
    const retried = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(retried.result.current).toEqual(index));
  });

  it('falls back to a timer where requestIdleCallback is missing', async () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    serveIndex();
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));
    expect(indexRequests).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    vi.useRealTimers();

    await waitFor(() => expect(result.current).toEqual(index));
  });
});
