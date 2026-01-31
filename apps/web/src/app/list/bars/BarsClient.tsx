'use client';

import { byNameListConfig, getBarSearchText } from '@cocktails/data/client';
import { Card, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getBarRecipesUrl } from '@/modules/url';

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
