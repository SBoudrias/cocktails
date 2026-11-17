'use client';

import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { P, match } from 'ts-pattern';
import { LinkList } from '#/components/list/LinkList';
import { fuzzySearch } from '#/modules/fuzzySearch';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { ListConfig } from '#/modules/lists/type';

/** A row whose node a server page rendered; its data (name for grouping,
 * search text) travels with it so this list can search and group it. */
export type SearchableRow = { name: string; node: ReactNode; searchText: string };

/**
 * A searchable list: with a term, the items that fuzzy-match (flat); without
 * one, the grouped list.
 *
 * Server pages pass `rows` — one pre-rendered node per item, built inline in
 * the page — and omit `searchTerm`, so this list reads the ?search URL
 * parameter itself. Client islands pass `items` with their
 * `getSearchText`/`renderItem` and their own term.
 */
export default function SearchableList<const T>(
  props:
    | {
        rows: SearchableRow[];
        /** Omitted: the list reads the ?search URL parameter itself. */
        searchTerm?: string | null;
        emptyState: ReactNode;
      }
    | {
        items: T[];
        getSearchText: (item: T) => string;
        renderItem: (item: T) => ReactNode;
        /** Omitted: the list reads the ?search URL parameter itself. */
        searchTerm?: string | null;
        config?: ListConfig<T>;
        emptyState: ReactNode;
      },
) {
  const [urlSearchTerm] = useQueryState('search');
  const searchTerm = props.searchTerm !== undefined ? props.searchTerm : urlSearchTerm;

  return match(props)
    .with({ rows: P.array(P.any) }, ({ rows, emptyState }) => (
      <RowsList rows={rows} searchTerm={searchTerm} emptyState={emptyState} />
    ))
    .otherwise(({ items, getSearchText, renderItem, config, emptyState }) => (
      <ItemsList
        items={items}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm={searchTerm}
        config={config}
        emptyState={emptyState}
      />
    ));
}

/** The rows mode: server-rendered nodes searched by their search text and
 * grouped by their name's first letter (skipping articles, numbers under #). */
function RowsList({
  rows,
  searchTerm,
  emptyState,
}: {
  rows: SearchableRow[];
  searchTerm: string | null;
  emptyState: ReactNode;
}) {
  const haystack = useMemo(() => rows.map((row) => row.searchText), [rows]);

  const searchMatches = useMemo(
    () => fuzzySearch(rows, haystack, searchTerm),
    [haystack, rows, searchTerm],
  );

  const renderRow = useCallback((row: SearchableRow) => row.node, []);

  if (searchMatches.length > 0) {
    // When searching, show flat list (no grouping)
    return <LinkList items={searchMatches} renderItem={renderRow} />;
  }

  if (!searchTerm || searchTerm.trim().length === 0) {
    // When not searching, show grouped list
    return <LinkList items={rows} config={byNameListConfig} renderItem={renderRow} />;
  }

  return emptyState;
}

/** The items mode: a client island renders and searches its own items. */
function ItemsList<const T>({
  items,
  getSearchText,
  renderItem,
  searchTerm,
  config,
  emptyState,
}: {
  items: T[];
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  searchTerm: string | null;
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
