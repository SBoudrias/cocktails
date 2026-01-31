'use client';

import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getBarSearchText } from '#/modules/searchText';
import { getBarRecipesUrl } from '#/modules/url';
import { Card, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';

type Bar = { name: string; location?: string; recipeCount: number };

function renderBar(bar: Bar) {
  return (
    <LinkListItem
      key={bar.name + (bar.location ?? '')}
      href={getBarRecipesUrl(bar)}
      primary={bar.name}
      secondary={bar.location}
      tertiary={<Typography color="textSecondary">{bar.recipeCount}</Typography>}
    />
  );
}

export default function BarsClient({ bars }: { bars: Bar[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

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
      <SearchableList
        items={bars}
        getSearchText={getBarSearchText}
        config={byNameListConfig}
        renderItem={renderBar}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
