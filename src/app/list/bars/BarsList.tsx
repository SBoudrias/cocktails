'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { getBarRecipesUrl } from '@/modules/url';
import groupByFirstLetter from '@/modules/groupByFirstLetter';
import ListSearch from '@/components/ListSearch';
import { useListSearch } from '@/hooks/useListSearch';

export type Bar = {
  name: string;
  location?: string;
  recipeCount: number;
};

export type BarsListProps = {
  bars: Bar[];
};

export default function BarsList({ bars }: BarsListProps) {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    resultsCount,
    totalCount,
  } = useListSearch({
    items: bars,
    searchFields: (item) => {
      const fields = [item.name];

      // Add location if it exists
      if (item.location) {
        fields.push(item.location);
      }

      return fields;
    },
  });

  // Group items by first letter when not searching
  const groupedItems = useMemo(() => {
    if (isSearching) {
      return null;
    }
    return groupByFirstLetter(filteredItems);
  }, [filteredItems, isSearching]);

  return (
    <>
      <ListSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultsCount={resultsCount}
        totalCount={totalCount}
        isSearching={isSearching}
        placeholder="Search bars..."
        sticky
      />

      {/* Empty state when searching and no results */}
      {isSearching && filteredItems.length === 0 && (
        <Card sx={{ m: 2 }} role="status" aria-live="polite">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No bars found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No bars matched your search for &quot;{searchTerm}&quot;
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search results (flat list) */}
      {isSearching && filteredItems.length > 0 && (
        <List>
          <Paper square>
            {filteredItems.map((bar) => (
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
      )}

      {/* Grouped list when not searching */}
      {!isSearching && groupedItems && (
        <List>
          {groupedItems.map(([letter, bars]) => {
            if (!bars) return null;

            return (
              <li key={letter}>
                <List>
                  <ListSubheader>{letter}</ListSubheader>
                  <Paper square>
                    {bars.map((bar) => (
                      <Link
                        href={getBarRecipesUrl(bar)}
                        key={bar.name + (bar.location ?? '')}
                      >
                        <ListItem
                          divider
                          secondaryAction={
                            <Stack direction="row" spacing={1}>
                              <Typography color="textSecondary">
                                {bar.recipeCount}
                              </Typography>
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
              </li>
            );
          })}
        </List>
      )}
    </>
  );
}
