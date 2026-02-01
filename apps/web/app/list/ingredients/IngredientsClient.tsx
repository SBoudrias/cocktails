'use client';

import type { BaseIngredient, Category } from '@cocktails/data';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getIngredientOrCategorySearchText } from '#/modules/searchText';
import { getIngredientUrl } from '#/modules/url';

function renderIngredient(ingredient: BaseIngredient | Category) {
  return (
    <LinkListItem
      key={ingredient.slug}
      href={getIngredientUrl(ingredient)}
      primary={ingredient.name}
    />
  );
}

export default function IngredientsClient({
  ingredients,
}: {
  ingredients: (BaseIngredient | Category)[];
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
        getSearchText={getIngredientOrCategorySearchText}
        config={byNameListConfig}
        renderItem={renderIngredient}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
