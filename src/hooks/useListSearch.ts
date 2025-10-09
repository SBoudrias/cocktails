'use client';

import { useMemo, useCallback } from 'react';
import { useQueryState } from 'nuqs';
import uFuzzy from '@leeoniya/ufuzzy';
import transliterate from '@sindresorhus/transliterate';
import { useDebounce } from 'use-debounce';

export type SearchableItem = {
  searchableText: string;
  [key: string]: unknown;
};

export type UseListSearchOptions<T> = {
  items: T[];
  searchFields: (item: T) => string[];
  debounceMs?: number;
  maxResults?: number;
};

export type UseListSearchResult<T> = {
  searchTerm: string;
  setSearchTerm: (value: string | null) => void;
  debouncedSearchTerm: string;
  filteredItems: T[];
  isSearching: boolean;
  resultsCount: number;
  totalCount: number;
  clearSearch: () => void;
};

/**
 * Hook for implementing fuzzy search on lists
 * @param options - Configuration for the search
 * @returns Search state and filtered items
 */
export function useListSearch<T>({
  items,
  searchFields,
  debounceMs = 150,
  maxResults = 1000,
}: UseListSearchOptions<T>): UseListSearchResult<T> {
  // URL state management
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
  });

  // Debounce the search term
  const [debouncedSearchTerm] = useDebounce(searchTerm ?? '', debounceMs);

  // Build searchable haystack
  const haystack = useMemo(
    () =>
      items.map((item) => {
        const fields = searchFields(item);
        const searchText = fields.join(' ');
        return transliterate(searchText).toLowerCase();
      }),
    [items, searchFields],
  );

  // Perform fuzzy search
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim().length === 0) {
      return items;
    }

    const uf = new uFuzzy();
    const [matchIndexes] = uf.search(
      haystack,
      transliterate(debouncedSearchTerm).toLowerCase(),
      0,
      maxResults,
    );

    if (Array.isArray(matchIndexes) && matchIndexes.length > 0) {
      return matchIndexes
        .map((index) => items[index])
        .filter((item): item is T => item != null);
    }

    // No matches found
    return [];
  }, [haystack, items, debouncedSearchTerm, maxResults]);

  const clearSearch = useCallback(() => {
    setSearchTerm(null);
  }, [setSearchTerm]);

  return {
    searchTerm: searchTerm ?? '',
    setSearchTerm,
    debouncedSearchTerm: debouncedSearchTerm ?? '',
    filteredItems,
    isSearching: !!debouncedSearchTerm && debouncedSearchTerm.trim().length > 0,
    resultsCount: filteredItems.length,
    totalCount: items.length,
    clearSearch,
  };
}
