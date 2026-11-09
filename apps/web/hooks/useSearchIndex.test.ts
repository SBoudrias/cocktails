import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchIndex } from '#/modules/buildSearchIndex';
import { preloadSearchIndex, resetSearchIndexCache } from '#/modules/searchIndex';
import { useSearchIndex } from './useSearchIndex';

const index: SearchIndex = {
  '/recipes/a/daiquiri': {
    name: 'Daiquiri',
    source: 'Book A',
    searchText: 'daiquiri white rum lime',
  },
};

const fetchMock = vi.fn<typeof fetch>();
const requestIdleCallbackMock = vi.fn<(callback: () => void) => number>();
const cancelIdleCallbackMock = vi.fn<(handle: number) => void>();

/** Run the callback the hook handed to requestIdleCallback, as the browser would. */
function runIdle() {
  const callback = requestIdleCallbackMock.mock.lastCall?.[0];
  if (callback == null) throw new Error('no idle callback was scheduled');
  act(() => callback());
}

beforeEach(() => {
  resetSearchIndexCache();
  requestIdleCallbackMock.mockReturnValue(7);
  vi.stubGlobal('fetch', fetchMock);
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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches when idle and returns the index', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));

    runIdle();

    await waitFor(() => expect(result.current).toEqual(index));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('fetches right away, without waiting for idle, when urgent', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    const { result } = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(result.current).toEqual(index));
    expect(requestIdleCallbackMock).not.toHaveBeenCalled();
  });

  it('reuses a fetch already started by a search box focus', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    preloadSearchIndex();
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));

    runIdle();

    await waitFor(() => expect(result.current).toEqual(index));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('shares one fetch across mounts', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    const first = renderHook(() => useSearchIndex({ urgent: true }));
    await waitFor(() => expect(first.result.current).toEqual(index));
    first.unmount();

    const second = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(second.result.current).toEqual(index));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('switches to an immediate fetch when a search becomes active', async () => {
    fetchMock.mockResolvedValue(Response.json(index));
    const { result, rerender } = renderHook(({ urgent }) => useSearchIndex({ urgent }), {
      initialProps: { urgent: false },
    });

    rerender({ urgent: true });

    await waitFor(() => expect(result.current).toEqual(index));
    expect(cancelIdleCallbackMock).toHaveBeenCalledWith(7);
  });

  it('cancels the idle callback on unmount', () => {
    const { unmount } = renderHook(() => useSearchIndex({ urgent: false }));

    unmount();

    expect(cancelIdleCallbackMock).toHaveBeenCalledWith(7);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stays undefined when the fetch fails, then recovers on the next mount', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    const failed = renderHook(() => useSearchIndex({ urgent: true }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await act(async () => {});
    expect(failed.result.current).toBeUndefined();
    failed.unmount();

    fetchMock.mockResolvedValueOnce(Response.json(index));
    const retried = renderHook(() => useSearchIndex({ urgent: true }));

    await waitFor(() => expect(retried.result.current).toEqual(index));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to a timer where requestIdleCallback is missing', async () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(Response.json(index));
    const { result } = renderHook(() => useSearchIndex({ urgent: false }));
    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    vi.useRealTimers();

    await waitFor(() => expect(result.current).toEqual(index));
  });
});
