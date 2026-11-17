'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import useLocalStorage from '#/hooks/useLocalStorage';
import { byLocationListConfig } from '#/modules/lists/by-location';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getBarSearchText } from '#/modules/searchText';
import { getBarRecipesUrl } from '#/modules/url';

type Bar = { name: string; location?: string; recipeCount: number };

type GroupMode = 'alpha' | 'city';

/**
 * The bars list: the one entity list that is a client island, because its
 * grouping toggle (localStorage) and the rows' location sub-label react to
 * client state the server page cannot render.
 */
export default function BarList({ bars }: { bars: Bar[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const [groupMode, setGroupMode] = useLocalStorage<GroupMode>('bars-grouping', 'alpha');

  const hasLocations = bars.some((bar) => bar.location);
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const isCityMode = hasLocations && groupMode === 'city';

  const listConfig = isCityMode ? byLocationListConfig : byNameListConfig;

  // City-mode groups carry the full location in their header, so the item
  // sub-label would only repeat it. Keep it anywhere the list is flat.
  const showLocation = !isCityMode || isSearching;

  return (
    <>
      <SearchHeader
        title="All Bars"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {hasLocations && !isSearching && (
        <div className="mx-4 flex justify-end">
          <ToggleGroup
            value={groupMode}
            onChange={(newValue) => {
              if (newValue === 'alpha' || newValue === 'city') {
                setGroupMode(newValue);
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
        items={bars}
        getSearchText={getBarSearchText}
        config={listConfig}
        renderItem={(bar) => (
          <LinkListItem
            key={bar.name + (bar.location ?? '')}
            href={getBarRecipesUrl(bar)}
            primary={bar.name}
            secondary={showLocation ? bar.location : undefined}
            count={bar.recipeCount}
          />
        )}
        searchTerm={searchTerm}
        emptyState={
          <Card m={2}>
            <CardHeader>
              <CardTitle>No results found</CardTitle>
            </CardHeader>
          </Card>
        }
      />
    </>
  );
}
