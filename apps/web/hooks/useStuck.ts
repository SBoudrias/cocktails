'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * Whether a sticky element currently has content behind it: true from the
 * moment the rows that follow it start sliding under it, until its group's
 * bottom edge has carried the last of them past its top — including while
 * a released header rides out over its own tail rows. Transparent while in
 * flow, the caller can give it a background only while this is true — rows
 * scroll under a pinned header and would bleed through anything see-through.
 *
 * Measured between the header and the content that follows it — two boxes
 * inside the same document — rather than between the header and the
 * viewport. A viewport measure ("the header's on-screen top sits at its
 * sticky offset") breaks exactly when it matters most: pulling past the
 * end of the page rubber-bands the whole document, the sticky header
 * included, while window.scrollY clamps at its range — the header
 * measures as unstuck while rows still sit behind it, and the glass
 * drops mid-pull. The content-behind measure moves with the document, so
 * it survives the shift — and rows behind the header is what the glass
 * exists for, either way.
 *
 * Re-measured on scroll (captured at the window, so inner scrollers count
 * too) inside a rAF, not watched with an IntersectionObserver on a 1px
 * band: on iOS Safari that rootMargin trick never fires — WebKit
 * mis-handles negative root margins against sticky elements
 * (https://bugs.webkit.org/show_bug.cgi?id=286836, still open).
 */
export function useStuck(
  ref: RefObject<HTMLElement | null>,
  /**
   * The painted content that can end up behind the sticky element,
   * resolved from it: one element or the list of them. Defaults to the
   * next sibling — the group's rows block, whose box is where its rows
   * paint. react-virtuoso's sticky TopItemList wrapper is followed by
   * the scroller, whose box spans empty space above its first row, so
   * it resolves to the rows the scroller has actually rendered — only
   * they say where painted content is (the box carries the full list
   * height, rendered or not).
   */
  content?: (el: HTMLElement) => Element | Element[] | null,
): boolean {
  const [stuck, setStuck] = useState(false);

  // The resolver is an inline arrow at the call site; hold it in a ref so
  // a new identity never resubscribes the scroll listeners.
  const resolveContent = useRef(content);
  useEffect(() => {
    resolveContent.current = content;
  });

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const resolved = resolveContent.current?.(el) ?? el.nextElementSibling;
      const painted = resolved instanceof Element ? [resolved] : (resolved ?? []);
      // Content behind the header: some box of it starts above the
      // header's bottom edge (rows under it) and still ends below its
      // top (the group's tail has not fully ridden out past it).
      const pinned = painted.some((paintedEl) => {
        const box = paintedEl.getBoundingClientRect();
        return box.top < rect.bottom - 0.5 && box.bottom > rect.top + 0.5;
      });
      // Same value in, same state out: React bails on the identical state,
      // so this never re-renders a settled header while the page scrolls on.
      setStuck((was) => (was === pinned ? was : pinned));
    };

    const scheduleMeasure = () => {
      if (raf === 0) raf = requestAnimationFrame(measure);
    };

    // Capture: the lists stick against the window scroll, and this also
    // catches any inner scroller that ends up moving the header.
    window.addEventListener('scroll', scheduleMeasure, {
      capture: true,
      passive: true,
    });
    // The boxes re-wrap when the viewport changes size.
    window.addEventListener('resize', scheduleMeasure);
    // Restored from the back/forward cache with the page mid-scroll.
    window.addEventListener('pageshow', scheduleMeasure);

    scheduleMeasure();
    return () => {
      window.removeEventListener('scroll', scheduleMeasure, { capture: true });
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return stuck;
}
