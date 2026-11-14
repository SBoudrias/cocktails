'use client';

import {
  Card,
  CardHeader,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
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
      tertiary={<Typography color="textSecondary">{bar.recipeCount}</Typography>}
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
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
    </Card>
  );

  return (
    <>
      <SearchHeader
        title="All Bars"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {hasLocations && !isSearching && (
        <Stack direction="row-reverse" sx={{ mx: 2 }}>
          <ToggleButtonGroup
            value={groupMode}
            exclusive
            onChange={(_, newValue: GroupMode | null) => {
              if (newValue) setGroupMode(newValue);
            }}
            size="small"
            aria-label="Bar grouping"
          >
            <ToggleButton value="alpha">A-Z</ToggleButton>
            <ToggleButton value="city">By City</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
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
