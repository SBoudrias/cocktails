'use client';

import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import AppBar from '#/components/AppBar';
import SearchInput from '#/components/SearchInput';
import { preloadSearchIndex } from '#/modules/searchIndex';

// The search variant of the app header: the searchbox where the title sat,
// with the page's h1 below the bar while no search is running.
//
// `searchTerm`/`onSearchChange` are omitted by server pages: the header then
// owns the ?search URL parameter itself — the one parameter every list page
// searches. Client islands that manage the term themselves pass it down.
export default function SearchHeader({
  title,
  searchTerm,
  onSearchChange,
  underTitle,
}: {
  title?: string;
  /** Omitted: the header reads and writes the ?search URL parameter itself. */
  searchTerm?: string | null;
  onSearchChange?: (value: string | null) => void;
  /** Rendered directly under the page title, hidden while a search is active. */
  underTitle?: ReactNode;
}) {
  const [urlSearchTerm, setUrlSearchTerm] = useQueryState('search');
  const term = searchTerm !== undefined ? searchTerm : urlSearchTerm;

  return (
    <>
      <AppBar>
        {/* Searches beyond names need the shared index: start loading it as
            soon as the user reaches for the search box. */}
        <SearchInput
          value={term ?? ''}
          onChangeAction={onSearchChange ?? setUrlSearchTerm}
          onFocusAction={preloadSearchIndex}
        />
      </AppBar>
      {!term && title && (
        <h1 className="mx-4 my-2 text-2xl font-normal leading-[1.334]">{title}</h1>
      )}
      {!term && underTitle}
    </>
  );
}
