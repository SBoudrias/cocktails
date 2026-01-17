import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { ListConfig } from '@/modules/lists/type';
import { fuzzySearch } from '@/modules/fuzzySearch';
import { LinkList } from '../LinkList';

export default function SearchableList<const T>({
  items,
  searchTerm,
  getSearchText,
  renderItem,
  config,
  emptyState,
}: {
  items: T[];
  searchTerm: string | null;
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  config?: ListConfig<T>;
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
    return <LinkList items={items} config={config} renderItem={renderItem} />;
  }

  return emptyState;
}
