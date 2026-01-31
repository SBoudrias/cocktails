'use client';

import { byNameListConfig, getAuthorSearchText } from '@cocktails/data/client';
import { Card, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getAuthorRecipesUrl } from '@/modules/url';

type Author = { name: string; recipeCount: number };

function renderAuthor(author: Author) {
  return (
    <LinkListItem
      key={author.name}
      href={getAuthorRecipesUrl(author.name)}
      primary={author.name}
      tertiary={<Typography color="textSecondary">{author.recipeCount}</Typography>}
    />
  );
}

export default function AuthorsClient({ authors }: { authors: Author[] }) {
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
        config={byNameListConfig}
        renderItem={renderAuthor}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
