'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import SearchInput from '#/components/SearchInput';
import TikiMark from '#/components/TikiMark';
import { preloadSearchIndex } from '#/modules/searchIndex';

// The search variant of the app header: the same fixed bar as AppHeader
// (glass, blur, elevation-4 shadow), with the searchbox where the title
// sat and the page's h1 below it while no search is running.

// MUI's IconButton size="large" as utility classes: a 56px circle (12px
// padding around the 32px mark), nudged to the row's left edge by the -12px
// negative margin of its `edge` prop.
const markButton =
  'flex size-14 shrink-0 items-center justify-center self-center rounded-full transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none hover:bg-white/8 focus-visible:bg-white/12 aria-disabled:cursor-default aria-disabled:pointer-events-none aria-disabled:text-white/30';

export default function SearchHeader({
  title,
  underTitle,
  searchTerm,
  onSearchChange,
}: {
  title?: string;
  /** Rendered directly under the page title, hidden while a search is active. */
  underTitle?: ReactNode;
  searchTerm: string | null;
  onSearchChange: (value: string | null) => void;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1100] flex flex-col bg-[color:var(--header)] bg-[image:linear-gradient(rgba(255,255,255,0.092),rgba(255,255,255,0.092))] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.2),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_1px_10px_0px_rgba(0,0,0,0.12)] backdrop-blur-[8px]">
        <div className="flex min-h-[var(--app-bar-height)] items-center px-4 min-[600px]:px-6">
          {isHome ? (
            <button
              type="button"
              aria-disabled="true"
              tabIndex={-1}
              className={`${markButton} -ml-3`}
            >
              <TikiMark size={32} />
            </button>
          ) : (
            <Link href="/" aria-label="Go to home" className={`${markButton} -ml-3`}>
              <TikiMark size={32} />
            </Link>
          )}

          {/* Searches beyond names need the shared index: start loading it as
              soon as the user reaches for the search box. */}
          <SearchInput
            value={searchTerm ?? ''}
            onChangeAction={onSearchChange}
            onFocusAction={preloadSearchIndex}
          />
        </div>
      </header>
      {/* the toolbar's height, so content starts below the fixed bar */}
      <div className="min-h-[var(--app-bar-height)]" />
      {!searchTerm && title && (
        <h1 className="mx-4 my-2 text-2xl font-normal leading-[1.334]">{title}</h1>
      )}
      {!searchTerm && underTitle}
    </>
  );
}
