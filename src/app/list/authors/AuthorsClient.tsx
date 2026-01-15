'use client';

import { Typography } from '@mui/material';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { LinkList, LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getNameFirstLetter } from '@/modules/getNameFirstLetter';
import { getAuthorSearchText } from '@/modules/searchText';
import { getAuthorRecipesUrl } from '@/modules/url';

export default function AuthorsClient({
  authors,
}: {
  authors: { name: string; recipeCount: number }[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
    </Card>
  );

  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const groupByFirstLetter = useMemo(
    () => (author: { name: string }) => getNameFirstLetter(author.name),
    [],
  );

  return (
    <>
      <SearchHeader
        title="All Authors"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={authors}
        getSearchText={getAuthorSearchText}
        renderItem={(items) =>
          isSearching ? (
            <LinkList
              items={items}
              renderItem={(author) => (
                <LinkListItem
                  key={author.name}
                  href={getAuthorRecipesUrl(author.name)}
                  primary={author.name}
                  tertiary={
                    <Typography color="textSecondary">{author.recipeCount}</Typography>
                  }
                />
              )}
            />
          ) : (
            <LinkList
              items={items}
              groupBy={groupByFirstLetter}
              renderItem={(author) => (
                <LinkListItem
                  key={author.name}
                  href={getAuthorRecipesUrl(author.name)}
                  primary={author.name}
                  tertiary={
                    <Typography color="textSecondary">{author.recipeCount}</Typography>
                  }
                />
              )}
            />
          )
        }
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
