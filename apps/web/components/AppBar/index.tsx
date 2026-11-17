'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import TikiMark from '#/components/TikiMark';
import { iconButton } from './icon-button';

// The fixed app bar shared by both headers: the glass fill, 8px blur,
// white overlay and elevation-4 shadow around a toolbar row — the mark at
// the left edge, the header's own content (a centered title, or the
// searchbox) filling the rest of the row. The spacer div below reserves
// the toolbar's height so page content starts under the bar, never behind
// it. On the home page the mark's slot holds a disabled placeholder instead
// of a link: nothing to go back to, and the title stays centered.

export default function AppBar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-(--z-app-bar) bg-header bg-[linear-gradient(rgba(255,255,255,0.092),rgba(255,255,255,0.092))] text-foreground shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.2),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_1px_10px_0px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        <div className="flex min-h-(--app-bar-height) items-center px-4 min-[600px]:px-6">
          {isHome ? (
            <button
              type="button"
              aria-disabled="true"
              tabIndex={-1}
              className={`${iconButton} pointer-events-none -ml-3 size-14`}
            >
              <TikiMark size={32} />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go to home"
              className={`${iconButton} -ml-3 size-14`}
            >
              <TikiMark size={32} />
            </Link>
          )}
          {children}
        </div>
      </header>
      {/* the toolbar's height, so content starts below the fixed bar */}
      <div className="min-h-(--app-bar-height)" />
    </>
  );
}
