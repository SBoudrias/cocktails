'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { fuzzySearch } from '@/modules/fuzzySearch';

export default function SearchableList<T extends { name: string }>({
  items,
  getSearchText,
  renderItem,
  searchTerm,
  emptyState,
}: {
  items: T[];
  getSearchText: (item: T) => string;
  renderItem: (items: T[]) => ReactNode;
  searchTerm: string | null;
  emptyState: ReactNode;
}) {
  const haystack = useMemo(() => items.map(getSearchText), [items, getSearchText]);

  const searchMatches = useMemo(
    () => fuzzySearch(items, haystack, searchTerm),
    [haystack, items, searchTerm],
  );

  if (searchMatches.length > 0) {
    return renderItem(searchMatches);
  }

  if (!searchTerm || searchTerm.trim().length === 0) {
    return renderItem(items);
  }

  return emptyState;
}
