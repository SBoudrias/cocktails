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
import { getAuthorRecipesUrl } from '@/modules/url';
import groupByFirstLetter from '@/modules/groupByFirstLetter';
import ListSearch from '@/components/ListSearch';
import { useListSearch } from '@/hooks/useListSearch';

export type Author = {
  name: string;
  recipeCount: number;
};

export type AuthorsListProps = {
  authors: Author[];
};

export default function AuthorsList({ authors }: AuthorsListProps) {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    resultsCount,
    totalCount,
  } = useListSearch({
    items: authors,
    searchFields: (item) => [item.name],
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
        placeholder="Search authors..."
        sticky
      />

      {/* Empty state when searching and no results */}
      {isSearching && filteredItems.length === 0 && (
        <Card sx={{ m: 2 }} role="status" aria-live="polite">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No authors found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No authors matched your search for &quot;{searchTerm}&quot;
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search results (flat list) */}
      {isSearching && filteredItems.length > 0 && (
        <List>
          <Paper square>
            {filteredItems.map((author) => (
              <Link href={getAuthorRecipesUrl(author.name)} key={author.name}>
                <ListItem
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Typography color="textSecondary">{author.recipeCount}</Typography>
                      <ChevronRight />
                    </Stack>
                  }
                >
                  <ListItemText primary={author.name} />
                </ListItem>
              </Link>
            ))}
          </Paper>
        </List>
      )}

      {/* Grouped list when not searching */}
      {!isSearching && groupedItems && (
        <List>
          {groupedItems.map(([letter, authors]) => {
            if (!authors) return null;

            return (
              <li key={letter}>
                <List>
                  <ListSubheader>{letter}</ListSubheader>
                  <Paper square>
                    {authors.map((author) => (
                      <Link href={getAuthorRecipesUrl(author.name)} key={author.name}>
                        <ListItem
                          divider
                          secondaryAction={
                            <Stack direction="row" spacing={1}>
                              <Typography color="textSecondary">
                                {author.recipeCount}
                              </Typography>
                              <ChevronRight />
                            </Stack>
                          }
                        >
                          <ListItemText primary={author.name} />
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
