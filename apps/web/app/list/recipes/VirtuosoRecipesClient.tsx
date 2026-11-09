'use client';

import { Box, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useMemo, useRef, useState } from 'react';
import type { GroupedVirtuosoHandle, StateSnapshot } from 'react-virtuoso';
import { GroupedVirtuoso } from 'react-virtuoso';
import AllRecipesSearch from '#/components/AllRecipesSearch';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchHeader from '#/components/SearchHeader';
import { useSearchIndex } from '#/hooks/useSearchIndex';
import { byNameListConfig, getNameFirstLetter } from '#/modules/lists/by-name';
import { isRecipeUrl } from '#/modules/url';
import type { getRecipeUrl } from '#/modules/url';

type Row = { href: ReturnType<typeof getRecipeUrl>; name: string; source: string };

// PROTOTYPE: survives the unmount of a soft navigation, like the index cache.
// The library's snapshot (measured sizes + scroll) puts the list back, and
// the anchor (a row and its viewport position) corrects what the snapshot
// misses, to the pixel.
let saved: { state: StateSnapshot; href: string; top: number } | undefined;

function sortRows(rows: Row[]): Row[] {
  const grouped = Object.groupBy(rows, getNameFirstLetter);
  return Object.keys(grouped)
    .toSorted(byNameListConfig.sortHeaderBy)
    .flatMap((label) => (grouped[label] ?? []).toSorted(byNameListConfig.sortItemBy));
}

/**
 * PROTOTYPE (option C, react-virtuoso): one virtualized list of every
 * recipe. Group sizes come from the server, so the full height exists from
 * the first render; rows not loaded yet render as placeholders until the
 * search index lands.
 */
export default function VirtuosoRecipesClient({
  initialRecipes,
  letters,
}: {
  initialRecipes: Row[];
  letters: { label: string; count: number }[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const index = useSearchIndex({ urgent: true });
  const ref = useRef<GroupedVirtuosoHandle>(null);

  const rows = useMemo(
    () =>
      index == null
        ? initialRecipes
        : sortRows(
            Object.entries(index).flatMap(([href, entry]): Row[] =>
              isRecipeUrl(href) ? [{ href, name: entry.name, source: entry.source }] : [],
            ),
          ),
    [index, initialRecipes],
  );
  const groupCounts = useMemo(() => letters.map((letter) => letter.count), [letters]);

  // Right before a click navigates away: the snapshot, and the topmost
  // visible row with its position.
  const save = () => {
    const anchor = [
      ...document.querySelectorAll<HTMLElement>('[data-item-index] a[href]'),
    ]
      .map((link) => ({
        href: link.getAttribute('href'),
        top: link.getBoundingClientRect().top,
      }))
      .find((link) => link.top > 120);
    ref.current?.getState((state) => {
      if (anchor?.href) saved = { state, href: anchor.href, top: anchor.top };
    });
  };
  const [restore] = useState(() => saved);
  // The list settles over its first renders (measurements, rows swapped in
  // from the index): keep the anchor row in place until it has settled.
  const mountedAt = useRef(0);
  const correct = () => {
    if (restore == null) return;
    mountedAt.current ||= performance.now();
    if (performance.now() - mountedAt.current > 1500) return;
    const link = document.querySelector(`[data-item-index] a[href="${restore.href}"]`);
    if (link == null) return;
    const delta = Math.round(link.getBoundingClientRect().top - restore.top);
    if (delta !== 0) window.scrollBy(0, delta);
  };

  const jumpTo = (label: string) => {
    const groupIndex = letters.findIndex((letter) => letter.label === label);
    const itemIndex = groupCounts.slice(0, groupIndex).reduce((a, b) => a + b, 0);
    ref.current?.scrollToIndex({ index: itemIndex, groupIndex, align: 'start' });
  };

  return (
    <>
      <SearchHeader
        title="All Recipes"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <AllRecipesSearch searchTerm={searchTerm} />
      ) : (
        <>
          <Box
            component="nav"
            aria-label="Jump to letter"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mx: 2, my: 1 }}
          >
            {letters.map((letter) => (
              <button
                type="button"
                key={letter.label}
                onClick={() => jumpTo(letter.label)}
              >
                {letter.label}
              </button>
            ))}
          </Box>
          <div onClickCapture={save}>
            <GroupedVirtuoso
              ref={ref}
              useWindowScroll
              groupCounts={groupCounts}
              initialItemCount={initialRecipes.length}
              defaultItemHeight={69}
              increaseViewportBy={800}
              restoreStateFrom={restore?.state}
              itemsRendered={correct}
              groupContent={(groupIndex) => (
                <ListSubheader id={`group-header-${letters[groupIndex]?.label}`}>
                  {letters[groupIndex]?.label}
                </ListSubheader>
              )}
              itemContent={(itemIndex) => {
                const row = rows[itemIndex];
                return (
                  <Paper square>
                    {row ? (
                      <RecipeLinkListItem
                        href={row.href}
                        name={row.name}
                        source={row.source}
                      />
                    ) : (
                      <ListItem divider>
                        <ListItemText primary="…" secondary="…" />
                      </ListItem>
                    )}
                  </Paper>
                );
              }}
            />
          </div>
        </>
      )}
    </>
  );
}
