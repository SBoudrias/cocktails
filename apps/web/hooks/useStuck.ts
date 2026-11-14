'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * Whether a sticky element is currently pinned: true from the moment it
 * reaches its own `top` offset until the bottom of its containing block
 * releases it. Transparent while in flow, the caller can give it a background
 * only while this is true — rows scroll under a pinned header and would bleed
 * through anything see-through.
 *
 * Measured from the element's visual position rather than watched with an
 * IntersectionObserver on a 1px band: on iOS Safari that rootMargin trick
 * (the css-tricks "sticky event" sentinel) never fires, so the glass never
 * applied on real devices — WebKit mis-handles negative root margins against
 * sticky elements (https://bugs.webkit.org/show_bug.cgi?id=286836, still
 * open). The visual check is engine-agnostic: pinned is exactly "the header's
 * on-screen top sits at its own sticky offset" — in flow it is below it, and
 * one released by its group's bottom edge slides up past it.
 */
export function useStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    // The sticky offset the theme keeps just below the fixed app bar, per
    // breakpoint; re-read when it can change (app bar height, orientation).
    let offset = readOffset(el);

    let raf = 0;
    const measure = () => {
      raf = 0;
      const pinned = Math.abs(el.getBoundingClientRect().top - offset) < 0.5;
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
    // The offset moves with the app bar's height per breakpoint; the visual
    // position with the viewport size.
    const onResize = () => {
      offset = readOffset(el);
      scheduleMeasure();
    };
    window.addEventListener('resize', onResize);
    // Restored from the back/forward cache with the page mid-scroll.
    window.addEventListener('pageshow', scheduleMeasure);

    scheduleMeasure();
    return () => {
      window.removeEventListener('scroll', scheduleMeasure, { capture: true });
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', scheduleMeasure);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return stuck;
}

function readOffset(el: Element): number {
  const offset = parseFloat(getComputedStyle(el).top);
  return Number.isNaN(offset) ? Infinity : offset;
}
