'use client';

import { Typography } from '@mui/material';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkList, LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getBarSearchText } from '@/modules/searchText';
import { getBarRecipesUrl } from '@/modules/url';

export default function BarsClient({
  bars,
}: {
  bars: { name: string; location?: string; recipeCount: number }[];
}) {
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
        renderItem={(items, header) => (
          <LinkList
            items={items}
            header={header}
            renderItem={(bar) => (
              <LinkListItem
                key={bar.name + (bar.location ?? '')}
                href={getBarRecipesUrl(bar)}
                primary={bar.name}
                secondary={bar.location}
                tertiary={
                  <Typography color="textSecondary">{bar.recipeCount}</Typography>
                }
              />
            )}
          />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
