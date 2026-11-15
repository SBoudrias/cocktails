'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
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
    <div className="m-2 rounded-xl bg-card px-4 py-4 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10">
      No results found
    </div>
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
