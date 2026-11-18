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

/** A box on the page reporting its own place: the sticky header and the
 * content that follows it, each with a controllable rect. */
function stickyWithContent() {
  const doc = document.createElement('div');
  const el = document.createElement('div');
  const content = document.createElement('div');
  doc.append(el, content);
  document.body.appendChild(doc);

  let headerTop = 400;
  let headerBottom = 454;
  let contentTop = 454;
  let contentBottom = 900;
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: headerTop, bottom: headerBottom }),
  });
  Object.defineProperty(content, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: contentTop, bottom: contentBottom }),
  });

  return {
    el,
    /** The header pinned at the app bar, its rows scrolling under it. */
    pinned: () => {
      headerTop = 56;
      headerBottom = 110;
      contentTop = 30;
    },
    /** The header in flow, above its rows. */
    inFlow: () => {
      headerTop = 400;
      headerBottom = 454;
      contentTop = 454;
      contentBottom = 900;
    },
    /** The header released by its group's bottom edge, its tail rows
     * still riding out beneath it. */
    releasedWithTail: () => {
      headerTop = 20;
      headerBottom = 74;
      contentTop = -60;
      contentBottom = 50;
    },
    /** The header released and fully ridden out: nothing left under it. */
    releasedPastTail: () => {
      headerTop = 0;
      headerBottom = 54;
      contentTop = -400;
      contentBottom = -60;
    },
    /** Everything the rubber-band does: header and content shifted down
     * together, window.scrollY clamped at its range. */
    rubberBanded: () => {
      headerTop = 196;
      headerBottom = 250;
      contentTop = 155;
      contentBottom = 900;
    },
  };
}

/** Scroll, and let the scheduled measurement run. */
async function scroll() {
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('useStuck', () => {
  it('is false in flow, true once rows slide under the header, false when its group has fully ridden out', async () => {
    const page = stickyWithContent();
    const ref = { current: page.el };
    const { result } = renderHook(() => useStuck(ref));

    // In flow: the header sits above its rows.
    expect(result.current).toBe(false);

    // Pinned: rows slide under it.
    page.pinned();
    await scroll();
    expect(result.current).toBe(true);

    // Released by its group's bottom edge, but its tail rows still ride
    // out beneath it — the glass must hold.
    page.releasedWithTail();
    await scroll();
    expect(result.current).toBe(true);

    // Fully ridden out: nothing left behind it.
    page.releasedPastTail();
    await scroll();
    expect(result.current).toBe(false);
  });

  it('stays true through the bottom overscroll: the rubber-band shifts the whole document while scrollY clamps', async () => {
    const page = stickyWithContent();
    const ref = { current: page.el };
    const { result } = renderHook(() => useStuck(ref));

    page.pinned();
    await scroll();
    expect(result.current).toBe(true);

    // The pull: both boxes move down together; a viewport-absolute check
    // would call the header unstuck here (its top is no longer the
    // app-bar offset) while rows still sit behind it.
    page.rubberBanded();
    await scroll();
    expect(result.current).toBe(true);

    // And when the pull snaps back: still pinned, still glass.
    page.pinned();
    await scroll();
    expect(result.current).toBe(true);
  });

  it('resolves the painted content through the caller-provided lookup', async () => {
    const page = stickyWithContent();
    // The caller (react-virtuoso) resolves the rendered rows instead of
    // the scroller, whose box spans empty space above its first row.
    const controllableRow = (top: number) => {
      const row = document.createElement('div');
      let topAt = top;
      Object.defineProperty(row, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ top: topAt, bottom: topAt + 69 }),
      });
      return { row, setTop: (v: number) => (topAt = v) };
    };
    const first = controllableRow(1000);
    const second = controllableRow(1200);
    const rows = [first.row, second.row];
    document.body.append(...rows);

    const ref = { current: page.el };
    const { result } = renderHook(() => useStuck(ref, () => rows));

    page.pinned();
    first.setTop(1000);
    await scroll();
    expect(result.current).toBe(false);

    // A rendered row slides under the header.
    first.setTop(30);
    await scroll();
    expect(result.current).toBe(true);

    // It scrolls on through: nothing left behind the header.
    first.setTop(-120);
    await scroll();
    expect(result.current).toBe(false);
  });

  it('re-measures when the viewport resizes', async () => {
    const page = stickyWithContent();
    const ref = { current: page.el };
    const { result } = renderHook(() => useStuck(ref));

    page.inFlow();
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });
    await waitFor(() => expect(result.current).toBe(false));

    page.pinned();
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
