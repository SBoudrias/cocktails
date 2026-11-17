'use client';

import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import AppBar from '#/components/AppBar';
import { preloadSearchIndex } from '#/modules/searchIndex';
import SearchInput from './SearchInput';

// The search variant of the app header: the searchbox where the title sat,
// with the page's h1 below the bar while no search is running.
//
// Either the page passes its own controlled term and change handler
// together, or it passes neither and the header owns the ?search URL
// parameter itself — the one parameter every list page searches. A term
// without a handler (or the reverse) is a type error.
export default function SearchHeader(
  props:
    | {
        title?: string;
        /** The page's controlled term, paired with onSearchChange. */
        searchTerm: string | null;
        onSearchChange: (value: string | null) => void;
        /** Rendered directly under the page title, hidden while a search is active. */
        underTitle?: ReactNode;
      }
    | {
        title?: string;
        /** Omitted: the header reads and writes the ?search URL parameter itself. */
        underTitle?: ReactNode;
      },
) {
  const [urlSearchTerm, setUrlSearchTerm] = useQueryState('search');
  const controlled = 'searchTerm' in props;
  const searchTerm = controlled ? props.searchTerm : urlSearchTerm;
  const onSearchChange = controlled ? props.onSearchChange : setUrlSearchTerm;
  const { title, underTitle } = props;

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
