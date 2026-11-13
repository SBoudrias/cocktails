import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStuck } from './useStuck';

/** A minimal stand-in for the browser's IntersectionObserver: records the
 * observe setup so a test can play entries back, as the browser would. */
class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];

  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    IntersectionObserverMock.instances.push(this);
  }

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds = [];
}

/** Fire an entry at the last observer created, as the browser would. */
function intersect(isIntersecting: boolean) {
  const observer = IntersectionObserverMock.instances.at(-1);
  if (observer == null) throw new Error('no observer was created');
  const entries = [{ isIntersecting } as IntersectionObserverEntry];
  act(() => observer.callback(entries, observer));
}

beforeEach(() => {
  IntersectionObserverMock.instances.length = 0;
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
});

/** A sticky element attached to the page, as the callers' refs always are. */
function stickyElement(top?: string) {
  const el = document.createElement('div');
  if (top) el.style.top = top;
  document.body.appendChild(el);
  return el;
}

describe('useStuck', () => {
  it('is false until the browser reports the element pinned, then true', () => {
    const el = stickyElement('56px');
    const ref = { current: el };
    const { result } = renderHook(() => useStuck(ref));

    expect(result.current).toBe(false);

    intersect(true);
    expect(result.current).toBe(true);

    intersect(false);
    expect(result.current).toBe(false);
  });

  it('watches a one-pixel band at the element own sticky offset', () => {
    const el = stickyElement('56px');
    const ref = { current: el };
    renderHook(() => useStuck(ref));

    const observer = IntersectionObserverMock.instances.at(-1)!;
    expect(observer.options).toEqual({
      // 56px clipped off the top, everything but one pixel off the bottom:
      // the band a pinned element at top 56px overlaps exactly.
      rootMargin: '-56px 0px -711px 0px',
    });
    expect(observer.observe).toHaveBeenCalledWith(el);
  });

  it('re-observes when the viewport (and so the band) changes size', () => {
    const ref = { current: stickyElement('56px') };
    renderHook(() => useStuck(ref));

    expect(IntersectionObserverMock.instances).toHaveLength(1);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(IntersectionObserverMock.instances).toHaveLength(2);
    expect(IntersectionObserverMock.instances[0]!.disconnect).toHaveBeenCalled();
  });
});
