'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getAuthorSearchText } from '#/modules/searchText';
import { getAuthorRecipesUrl } from '#/modules/url';

type Author = { name: string; recipeCount: number };

function renderAuthor(author: Author) {
  return (
    <LinkListItem
      key={author.name}
      href={getAuthorRecipesUrl(author.name)}
      primary={author.name}
      tertiary={<span className="text-muted-foreground">{author.recipeCount}</span>}
    />
  );
}

export default function AuthorsClient({ authors }: { authors: Author[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <Card m={2}>
      <CardHeader>
        <CardTitle>No results found</CardTitle>
      </CardHeader>
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
