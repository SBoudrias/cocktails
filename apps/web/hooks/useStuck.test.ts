import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStuck } from './useStuck';

// The hook measures inside the rAF the browser would run on scroll; a
// microtask stub keeps it async like the real one, and act() flushes it.
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queueMicrotask(() => cb(0));
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
});

/** A sticky element attached to the page, reporting its top from the viewport. */
function stickyElement(top: string, flowTop = 400) {
  const el = document.createElement('div');
  el.style.top = top;
  let rectTop = flowTop;
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: rectTop }),
  });
  document.body.appendChild(el);
  return {
    el,
    placeAt: (v: number) => {
      rectTop = v;
    },
  };
}

/** Scroll, and let the scheduled measurement run. */
async function scroll() {
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
  });
}

async function resize() {
  await act(async () => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('useStuck', () => {
  it('is false until the header sits at its sticky offset, then true', async () => {
    const { el, placeAt } = stickyElement('56px');
    const ref = { current: el };
    const { result } = renderHook(() => useStuck(ref));

    // In flow: the header sits below the sticky offset.
    expect(result.current).toBe(false);

    placeAt(300);
    await scroll();
    expect(result.current).toBe(false);

    // Pinned: the header's top is exactly its own sticky offset.
    placeAt(56);
    await scroll();
    expect(result.current).toBe(true);

    // Released by its group's bottom edge: the header slides up past it.
    placeAt(20);
    await scroll();
    expect(result.current).toBe(false);
  });

  it('measures the actual sticky offset the theme sets, per breakpoint', async () => {
    const { el, placeAt } = stickyElement('64px');
    const ref = { current: el };
    const { result } = renderHook(() => useStuck(ref));

    // 56 would be a false positive from a hardcoded offset: the offset is 64.
    placeAt(56);
    await scroll();
    expect(result.current).toBe(false);

    placeAt(64);
    await scroll();
    expect(result.current).toBe(true);
  });

  it('re-reads the offset and re-measures when the viewport resizes', async () => {
    const { el, placeAt } = stickyElement('56px', 56);
    const ref = { current: el };
    const { result } = renderHook(() => useStuck(ref));

    placeAt(56);
    await scroll();
    expect(result.current).toBe(true);

    // A breakpoint changes the app bar's height, and so the sticky offset.
    el.style.top = '64px';
    await resize();
    await waitFor(() => expect(result.current).toBe(false));

    placeAt(64);
    await scroll();
    expect(result.current).toBe(true);
  });
});
