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
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { getIngredientUrl } from '@/modules/url';
import groupByFirstLetter from '@/modules/groupByFirstLetter';
import ListSearch from '@/components/ListSearch';
import { useListSearch } from '@/hooks/useListSearch';
import type { BaseIngredient, RootIngredient } from '@/types/Ingredient';

type Bottle = (BaseIngredient | RootIngredient) & {
  slug: string;
  name: string;
};

export type BottlesListProps = {
  bottles: Bottle[];
};

export default function BottlesList({ bottles }: BottlesListProps) {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    resultsCount,
    totalCount,
  } = useListSearch({
    items: bottles,
    searchFields: (item) => {
      const fields = [item.name];

      // Add type
      if (item.type) {
        fields.push(item.type);
      }

      // Add categories if they exist
      if ('categories' in item && Array.isArray(item.categories)) {
        fields.push(...item.categories.map((cat) => cat.name));
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
        placeholder="Search bottles..."
        sticky
      />

      {/* Empty state when searching and no results */}
      {isSearching && filteredItems.length === 0 && (
        <Card sx={{ m: 2 }} role="status" aria-live="polite">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No bottles found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No bottles matched your search for &quot;{searchTerm}&quot;
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search results (flat list) */}
      {isSearching && filteredItems.length > 0 && (
        <List>
          <Paper square>
            {filteredItems.map((bottle) => (
              <Link href={getIngredientUrl(bottle)} key={bottle.slug}>
                <ListItem divider secondaryAction={<ChevronRight />}>
                  <ListItemText
                    primary={bottle.name}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </ListItem>
              </Link>
            ))}
          </Paper>
        </List>
      )}

      {/* Grouped list when not searching */}
      {!isSearching && groupedItems && (
        <List>
          {groupedItems.map(([letter, bottles]) => {
            if (!bottles) return null;

            return (
              <li key={letter}>
                <List>
                  <ListSubheader>{letter}</ListSubheader>
                  <Paper square>
                    {bottles.map((bottle) => (
                      <Link href={getIngredientUrl(bottle)} key={bottle.slug}>
                        <ListItem divider secondaryAction={<ChevronRight />}>
                          <ListItemText
                            primary={bottle.name}
                            sx={{ textTransform: 'capitalize' }}
                          />
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
