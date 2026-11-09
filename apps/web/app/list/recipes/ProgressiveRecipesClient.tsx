'use client';

import { Box, List, ListSubheader, Paper } from '@mui/material';
import { useQueryState } from 'nuqs';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import AllRecipesSearch from '#/components/AllRecipesSearch';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchHeader from '#/components/SearchHeader';
import { useSearchIndex } from '#/hooks/useSearchIndex';
import { byNameListConfig, getNameFirstLetter } from '#/modules/lists/by-name';
import { loadSearchIndex } from '#/modules/searchIndex';
import { isRecipeUrl } from '#/modules/url';
import type { getRecipeUrl } from '#/modules/url';

type Row = { href: ReturnType<typeof getRecipeUrl>; name: string; source: string };
type Group = { label: string; rows: Row[] };

function toGroups(rows: Row[]): Group[] {
  const grouped = Object.groupBy(rows, getNameFirstLetter);
  return Object.keys(grouped)
    .toSorted(byNameListConfig.sortHeaderBy)
    .map((label) => ({
      label,
      rows: (grouped[label] ?? []).toSorted(byNameListConfig.sortItemBy),
    }));
}

function groupId(label: string) {
  return `group-header-${label}`;
}

const RecipeGroup = memo(function RecipeGroup({ group }: { group: Group }) {
  return (
    <li>
      <List role="group" aria-labelledby={groupId(group.label)}>
        <ListSubheader id={groupId(group.label)}>{group.label}</ListSubheader>
        <Paper square>
          {group.rows.map((row) => (
            <RecipeLinkListItem
              key={row.href}
              href={row.href}
              name={row.name}
              source={row.source}
            />
          ))}
        </Paper>
      </List>
    </li>
  );
});

function scheduleIdle(callback: () => void) {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback, { timeout: 500 });
    return () => cancelIdleCallback(handle);
  }
  const timer = setTimeout(callback, 16);
  return () => clearTimeout(timer);
}

/**
 * PROTOTYPE (option C): one list of every recipe. The first letters ship in
 * the static HTML; the rest renders from the shared search index, one letter
 * group per idle slot, always below what is already on screen.
 */
export default function ProgressiveRecipesClient({
  initialRecipes,
  letters,
}: {
  initialRecipes: Row[];
  letters: { label: string; count: number }[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const index = useSearchIndex({ urgent: true });

  const groups = useMemo(() => {
    if (index == null) return toGroups(initialRecipes);
    return toGroups(
      Object.entries(index).flatMap(([href, entry]): Row[] =>
        isRecipeUrl(href) ? [{ href, name: entry.name, source: entry.source }] : [],
      ),
    );
  }, [index, initialRecipes]);

  // How many groups are on the page. Already loaded (soft navigation back):
  // everything at once, so scroll restoration lands on the same content.
  const [renderedCount, setRenderedCount] = useState(() =>
    index == null ? groups.length : Number.POSITIVE_INFINITY,
  );

  useEffect(() => {
    if (index == null || renderedCount >= groups.length) return;
    return scheduleIdle(() => setRenderedCount((count) => count + 1));
  }, [index, renderedCount, groups.length]);

  const jumpTo = useCallback(
    async (label: string) => {
      const loadedGroups =
        index == null
          ? toGroups(
              Object.entries(await loadSearchIndex()).flatMap(([href, entry]): Row[] =>
                isRecipeUrl(href)
                  ? [{ href, name: entry.name, source: entry.source }]
                  : [],
              ),
            )
          : groups;
      const position = loadedGroups.findIndex((group) => group.label === label);
      flushSync(() => setRenderedCount((count) => Math.max(count, position + 1)));
      document.getElementById(groupId(label))?.closest('li')?.scrollIntoView({
        behavior: 'instant',
        block: 'start',
      });
    },
    [index, groups],
  );

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
              <a
                key={letter.label}
                href={`#${groupId(letter.label)}`}
                onClick={(event) => {
                  event.preventDefault();
                  void jumpTo(letter.label);
                }}
              >
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', minWidth: 32, justifyContent: 'center' }}
                >
                  {letter.label}
                </Box>
              </a>
            ))}
          </Box>
          <List>
            {groups.slice(0, renderedCount).map((group) => (
              <RecipeGroup key={group.label} group={group} />
            ))}
          </List>
        </>
      )}
    </>
  );
}
