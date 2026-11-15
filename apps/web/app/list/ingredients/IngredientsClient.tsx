'use client';

import { useQueryState } from 'nuqs';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import type { IngredientListItem } from '#/modules/ingredientListItem';
import { byNameListConfig } from '#/modules/lists/by-name';
import styles from './style.module.css';

function renderIngredient(ingredient: IngredientListItem) {
  return (
    <LinkListItem
      key={ingredient.href}
      href={ingredient.href}
      primary={<span className={styles.name}>{ingredient.name}</span>}
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
      <Card m={2}>
        <CardHeader>
          <CardTitle>No results found</CardTitle>
        </CardHeader>
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
