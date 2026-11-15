'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import useLocalStorage from '#/hooks/useLocalStorage';
import { byLocationListConfig } from '#/modules/lists/by-location';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getBarSearchText } from '#/modules/searchText';
import { getBarRecipesUrl } from '#/modules/url';

type Bar = { name: string; location?: string; recipeCount: number };

type GroupMode = 'alpha' | 'city';

function renderBar(bar: Bar, showLocation: boolean) {
  return (
    <LinkListItem
      key={bar.name + (bar.location ?? '')}
      href={getBarRecipesUrl(bar)}
      primary={bar.name}
      secondary={showLocation ? bar.location : undefined}
      tertiary={<span className="text-muted-foreground">{bar.recipeCount}</span>}
    />
  );
}

export default function BarsClient({ bars }: { bars: Bar[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const [groupMode, setGroupMode] = useLocalStorage<GroupMode>('bars-grouping', 'alpha');

  const hasLocations = bars.some((bar) => bar.location);
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const isCityMode = hasLocations && groupMode === 'city';

  const listConfig = isCityMode ? byLocationListConfig : byNameListConfig;

  // City-mode groups carry the full location in their header, so the item
  // sub-label would only repeat it. Keep it anywhere the list is flat.
  const showLocation = !isCityMode || isSearching;

  const emptyState = (
    <div className="m-2 rounded-xl bg-card px-4 py-4 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10">
      No results found
    </div>
  );

  return (
    <>
      <SearchHeader
        title="All Bars"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {hasLocations && !isSearching && (
        <div className="mx-4 flex flex-row-reverse">
          <ToggleGroup
            value={[groupMode]}
            onValueChange={([newValue]) => {
              if (newValue) setGroupMode(newValue);
            }}
            variant="outline"
            spacing={0}
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
        renderItem={(bar) => renderBar(bar, showLocation)}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
