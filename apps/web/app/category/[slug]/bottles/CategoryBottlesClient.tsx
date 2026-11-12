'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import type { IngredientListItem } from '#/modules/ingredientListItem';
import { byNameListConfig } from '#/modules/lists/by-name';

function renderBottle(bottle: IngredientListItem) {
  return <LinkListItem key={bottle.href} href={bottle.href} primary={bottle.name} />;
}

export default function CategoryBottlesClient({
  title,
  bottles,
}: {
  title: string;
  bottles: IngredientListItem[];
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
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={bottles}
        getSearchText={(bottle) => bottle.searchText}
        config={byNameListConfig}
        renderItem={renderBottle}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
