'use client';

import { Card, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkList, LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
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
        renderItem={(items, header) => (
          <LinkList
            items={items}
            header={header}
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
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
