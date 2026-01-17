'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { fuzzySearch } from '@/modules/fuzzySearch';
import { LinkList } from '../LinkList';

export default function SearchableList<T extends { name: string }>({
  items,
  getSearchText,
  renderItem,
  groupBy,
  searchTerm,
  emptyState,
}: {
  items: T[];
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  groupBy?: (item: T) => string;
  searchTerm: string | null;
  emptyState: ReactNode;
}) {
  const haystack = useMemo(() => items.map(getSearchText), [items, getSearchText]);

  const searchMatches = useMemo(
    () => fuzzySearch(items, haystack, searchTerm),
    [haystack, items, searchTerm],
  );

  if (searchMatches.length > 0) {
    // When searching, show flat list (no grouping)
    return <LinkList items={searchMatches} renderItem={renderItem} />;
  }

  if (!searchTerm || searchTerm.trim().length === 0) {
    // When not searching, show grouped list
    return <LinkList items={items} groupBy={groupBy} renderItem={renderItem} />;
  }

  return emptyState;
}
