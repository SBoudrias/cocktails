'use client';

import Link from 'next/link';
import { getNameSearchText } from '@/modules/searchText';
import { getAuthorRecipesUrl } from '@/modules/url';
import { Card, CardHeader, Stack, Typography } from '@mui/material';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useQueryState } from 'nuqs';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import SearchAllLink from '@/components/SearchAllLink';

export default function AuthorsClient({
  authors,
}: {
  authors: { name: string; recipeCount: number }[];
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
    items: { name: string; recipeCount: number }[],
    header?: string,
  ) => {
    const headerId = header ? `group-header-${header}` : undefined;

    return (
      <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
        {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
        <Paper square>
          {items.map((author) => (
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
    );
  };

  return (
    <>
      <SearchHeader
        title="All Authors"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={authors}
        getSearchText={getNameSearchText}
        renderItem={renderItem}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
