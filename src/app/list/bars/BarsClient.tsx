'use client';

import Link from 'next/link';
import { getBarSearchText } from '@/modules/searchText';
import { getBarRecipesUrl } from '@/modules/url';
import { Card, CardHeader, Stack, Typography } from '@mui/material';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useQueryState } from 'nuqs';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import SearchAllLink from '@/components/SearchAllLink';

export default function BarsClient({
  bars,
}: {
  bars: { name: string; location?: string; recipeCount: number }[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderItem = (
    items: { name: string; location?: string; recipeCount: number }[],
    header?: string,
  ) => {
    const headerId = header ? `group-header-${header}` : undefined;

    return (
      <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
        {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
        <Paper square>
          {items.map((bar) => (
            <Link href={getBarRecipesUrl(bar)} key={bar.name + (bar.location ?? '')}>
              <ListItem
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Typography color="textSecondary">{bar.recipeCount}</Typography>
                    <ChevronRight />
                  </Stack>
                }
              >
                <ListItemText primary={bar.name} secondary={bar.location} />
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
    );
  };

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
        renderItem={renderItem}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
