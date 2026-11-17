'use client';

import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { match } from 'ts-pattern';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import useLocalStorage from '#/hooks/useLocalStorage';
import { byLocationListConfig } from '#/modules/lists/by-location';
import { byNameListConfig } from '#/modules/lists/by-name';
import type {
  getAuthorRecipesUrl,
  getBarRecipesUrl,
  getIngredientUrl,
} from '#/modules/url';

type EntityVariant = 'author' | 'bar' | 'bottle' | 'ingredient';

/** Any route an entity row can link to: author/bar recipe lists, ingredient
 * and category pages. */
type EntityHref =
  | ReturnType<typeof getAuthorRecipesUrl>
  | ReturnType<typeof getBarRecipesUrl>
  | ReturnType<typeof getIngredientUrl>;

type BarGroupMode = 'alpha' | 'city';

type EntityRow = {
  name: string;
  href: EntityHref;
  /** Transliterated search text, precomputed on the server. */
  searchText: string;
  /** Bars only: the row's sub-label wherever the list is flat. */
  location?: string;
  /** Authors and bars: the trailing recipe count. */
  count?: number;
};

/**
 * The search island of a page listing entities (authors, bars, bottles,
 * ingredients): the search header, the searchable A–Z list, and for bars the
 * grouping toggle. The page (a server component) loads its data and reduces
 * each entity to a serializable row — link, search text, location, count —
 * so no per-route client file is needed.
 */
export default function SearchableEntityList({
  variant,
  title,
  rows,
}: {
  variant: EntityVariant;
  title: string;
  rows: EntityRow[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  // Only the bar list reads and writes this; the hook must run unconditionally.
  const [barGroupMode, setBarGroupMode] = useLocalStorage<BarGroupMode>(
    'bars-grouping',
    'alpha',
  );

  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const hasLocations = rows.some((row) => row.location);
  const isCityMode = hasLocations && barGroupMode === 'city';

  // City-mode groups carry the full location in their header, so the item
  // sub-label would only repeat it. Keep it anywhere the list is flat.
  const showLocation = !isCityMode || isSearching;

  const listConfig = isCityMode ? byLocationListConfig : byNameListConfig;

  const getSearchText = useCallback((row: EntityRow) => row.searchText, []);

  const renderRow = (row: EntityRow) =>
    match(variant)
      .with('author', () => (
        <LinkListItem
          key={row.name}
          href={row.href}
          primary={row.name}
          count={row.count}
        />
      ))
      .with('bar', () => (
        <LinkListItem
          key={row.name + (row.location ?? '')}
          href={row.href}
          primary={row.name}
          secondary={showLocation ? row.location : undefined}
          count={row.count}
        />
      ))
      .with('bottle', () => (
        <LinkListItem key={row.href} href={row.href} primary={row.name} />
      ))
      // Ingredient names ship lowercase in the data ("lime", "green apple"),
      // so the rows title-case them like the recipe ingredient list does.
      .with('ingredient', () => (
        <LinkListItem
          key={row.href}
          href={row.href}
          primary={<span className="capitalize">{row.name}</span>}
        />
      ))
      .exhaustive();

  const emptyState = match(variant)
    .with('ingredient', () => (
      <>
        <Card m={2}>
          <CardHeader>
            <CardTitle>No results found</CardTitle>
          </CardHeader>
        </Card>
        <SearchAllLink searchTerm={searchTerm} />
      </>
    ))
    .otherwise(() => (
      <Card m={2}>
        <CardHeader>
          <CardTitle>No results found</CardTitle>
        </CardHeader>
      </Card>
    ));

  return (
    <>
      <SearchHeader
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {variant === 'bar' && hasLocations && !isSearching && (
        <div className="mx-4 flex justify-end">
          <ToggleGroup
            value={[barGroupMode]}
            onValueChange={([newValue]) => {
              // A single-choice group: the pressed value is the new mode.
              if (newValue === 'alpha' || newValue === 'city') {
                setBarGroupMode(newValue);
              }
            }}
            aria-label="Bar grouping"
          >
            <ToggleGroupItem value="alpha">A-Z</ToggleGroupItem>
            <ToggleGroupItem value="city">By City</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <SearchableList
        items={rows}
        getSearchText={getSearchText}
        config={listConfig}
        renderItem={renderRow}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
