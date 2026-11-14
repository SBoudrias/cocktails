'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import type { IngredientListItem } from '#/modules/ingredientListItem';
import { byNameListConfig } from '#/modules/lists/by-name';

function renderBottle(bottle: IngredientListItem) {
  return <LinkListItem key={bottle.href} href={bottle.href} primary={bottle.name} />;
}

function getSearchText(bottle: IngredientListItem) {
  return bottle.searchText;
}

export default function BottlesClient({ bottles }: { bottles: IngredientListItem[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>No results found</CardTitle>
      </CardHeader>
    </Card>
  );

  return (
    <>
      <SearchHeader
        title="All Bottles"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={bottles}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderBottle}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
