'use client';

import { useEffect } from 'react';

const TYPING_TARGETS = ['INPUT', 'TEXTAREA', 'SELECT'];

export default function SearchShortcut() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Bare `/` only: shortcuts like Ctrl+/ or Cmd+/ belong to the browser
      // or other tooling, and an already-handled event is not ours to intercept.
      if (
        event.key !== '/' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.isComposing
      ) {
        return;
      }
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.isContentEditable || TYPING_TARGETS.includes(target?.tagName ?? '')) {
        return;
      }

      // Prefer the current page's filter. Fall back to the explicit global
      // launcher on desktop pages without a filter; hidden inputs never count.
      const visibleInputs = [
        ...document.querySelectorAll<HTMLInputElement>('input[type="search"]'),
      ].filter((input) => input.getClientRects().length > 0);
      const searchBox =
        visibleInputs.find((input) => !input.closest('nav')) ?? visibleInputs.at(0);
      if (searchBox == null) return;

      event.preventDefault();
      searchBox.focus({ preventScroll: true });
      // The global launcher may be above the sidebar's own scroll position.
      // Reveal it inside that pane without moving the document.
      const nav = searchBox.closest('nav');
      if (nav != null) nav.scrollTop = 0;
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
