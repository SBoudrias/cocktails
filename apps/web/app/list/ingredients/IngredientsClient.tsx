'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import type { IngredientListItem } from '#/modules/ingredientListItem';
import { byNameListConfig } from '#/modules/lists/by-name';

function renderIngredient(ingredient: IngredientListItem) {
  return (
    <LinkListItem
      key={ingredient.href}
      href={ingredient.href}
      primary={ingredient.name}
    />
  );
}

function getSearchText(ingredient: IngredientListItem) {
  return ingredient.searchText;
}

export default function IngredientsClient({
  ingredients,
}: {
  ingredients: IngredientListItem[];
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

  return (
    <>
      <SearchHeader
        title="All Ingredients"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={ingredients}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderIngredient}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
