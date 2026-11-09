'use client';

import type { ReactNode } from 'react';
import { useCallback } from 'react';
import SearchableList from '#/components/SearchableList';
import { useSearchIndex } from '#/hooks/useSearchIndex';
import type { ListConfig } from '#/modules/lists/type';
import { getIndexedSearchText } from '#/modules/searchIndex';

/**
 * A searchable list of recipes. Pages ship display fields only; the search
 * text of every recipe comes from the shared search index, fetched once per
 * session (when idle, or right away while a search is active).
 */
export default function RecipeSearchableList<
  const T extends { href: string; name: string },
>({
  items,
  searchTerm,
  renderItem,
  config,
  emptyState,
}: {
  items: T[];
  searchTerm: string | null;
  renderItem: (item: T) => ReactNode;
  config?: ListConfig<T>;
  emptyState: ReactNode;
}) {
  const index = useSearchIndex({
    urgent: searchTerm != null && searchTerm.trim() !== '',
  });
  const getSearchText = useCallback(
    (item: T) => getIndexedSearchText(item, index),
    [index],
  );

  return (
    <SearchableList
      items={items}
      searchTerm={searchTerm}
      getSearchText={getSearchText}
      renderItem={renderItem}
      config={config}
      emptyState={emptyState}
    />
  );
}
