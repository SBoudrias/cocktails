'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * Whether a sticky element is currently pinned: true from the moment it
 * reaches its own `top` offset until the bottom of its containing block
 * releases it. Transparent while in flow, the caller can give it a background
 * only while this is true — rows scroll under a pinned header and would bleed
 * through anything see-through.
 */
export function useStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    // The live observer; a resize swaps it for a fresh band.
    const observers: IntersectionObserver[] = [];
    const disconnectAll = () => {
      for (const observer of observers.splice(0)) observer.disconnect();
    };

    const observe = () => {
      disconnectAll();
      // The sticky offset the theme keeps just below the fixed app bar,
      // per breakpoint.
      const offset = parseFloat(getComputedStyle(el).top);
      if (Number.isNaN(offset)) return;
      // Shrink the root to a 1px band at that offset: a sticky element
      // overlaps it exactly while pinned. In flow it sits below the band,
      // and one released by its group's bottom edge slides up past it.
      const observer = new IntersectionObserver(
        (entries) => setStuck(entries[0]?.isIntersecting ?? false),
        {
          rootMargin: `${-offset}px 0px ${-(window.innerHeight - offset - 1)}px 0px`,
        },
      );
      observer.observe(el);
      observers.push(observer);
    };

    observe();
    // The offset changes with the app bar's height per breakpoint, and the
    // band's bottom margin with the viewport height.
    window.addEventListener('resize', observe);
    return () => {
      window.removeEventListener('resize', observe);
      disconnectAll();
    };
  }, [ref]);

  return stuck;
}
