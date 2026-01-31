'use client';

import type { Recipe } from '@cocktails/data';
import { LinkList, LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import useNameIsUnique from '#/hooks/useNameIsUnique';
import { getRecipeAttribution } from '#/modules/getRecipeAttribution';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';

export default function BarRecipesClient({
  barName,
  recipes,
}: {
  barName: string;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const nameIsUnique = useNameIsUnique(recipes);

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      const href = getRecipeUrl(recipe);
      return (
        <LinkListItem
          key={href}
          href={href}
          primary={recipe.name}
          secondary={
            nameIsUnique(recipe)
              ? undefined
              : getRecipeAttribution(recipe, { exclude: { bar: barName } })
          }
        />
      );
    },
    [nameIsUnique, barName],
  );

  return (
    <>
      <SearchHeader
        title={`Recipes from ${barName}`}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <LinkList header="All Recipes" items={recipes} renderItem={renderRecipe} />
      )}
    </>
  );
}
