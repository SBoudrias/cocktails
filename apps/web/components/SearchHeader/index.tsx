'use client';

import type { ReactNode } from 'react';
import AppBar from '#/components/AppBar';
import SearchInput from '#/components/SearchInput';
import { preloadSearchIndex } from '#/modules/searchIndex';

// The search variant of the app header: the searchbox where the title sat,
// with the page's h1 below the bar while no search is running.
export default function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
  underTitle,
}: {
  title?: string;
  searchTerm: string | null;
  onSearchChange: (value: string | null) => void;
  /** Rendered directly under the page title, hidden while a search is active. */
  underTitle?: ReactNode;
}) {
  return (
    <>
      <AppBar>
        {/* Searches beyond names need the shared index: start loading it as
            soon as the user reaches for the search box. */}
        <SearchInput
          value={searchTerm ?? ''}
          onChangeAction={onSearchChange}
          onFocusAction={preloadSearchIndex}
        />
      </AppBar>
      {!searchTerm && title && (
        <h1 className="mx-4 my-2 text-2xl leading-[1.334] font-normal">{title}</h1>
      )}
      {!searchTerm && underTitle}
    </>
  );
}
