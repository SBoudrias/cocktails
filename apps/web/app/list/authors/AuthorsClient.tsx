'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
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
    <div className="m-2 rounded-xl bg-card px-4 py-4 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10">
      No results found
    </div>
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
