'use client';

import { useEffect } from 'react';

const TYPING_TARGETS = ['INPUT', 'TEXTAREA', 'SELECT'];

export default function SearchShortcut() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.isContentEditable || TYPING_TARGETS.includes(target?.tagName ?? '')) {
        return;
      }

      // Only focus inputs that are actually rendered: the desktop sidebar
      // search is hidden on mobile, where the page's search box is the target.
      const searchBox = [
        ...document.querySelectorAll<HTMLInputElement>('input[type="search"]'),
      ].find((input) => input.getClientRects().length > 0);
      if (searchBox == null) return;

      event.preventDefault();
      searchBox.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
