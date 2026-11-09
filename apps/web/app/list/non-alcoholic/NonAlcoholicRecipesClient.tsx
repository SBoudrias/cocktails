'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import type { RecipeListItem } from '#/modules/recipeListItem';

export default function NonAlcoholicRecipesClient({
  recipes,
}: {
  recipes: RecipeListItem[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderRecipe = useCallback((recipe: RecipeListItem) => {
    return (
      <RecipeLinkListItem
        key={recipe.href}
        href={recipe.href}
        name={recipe.name}
        source={recipe.source}
      />
    );
  }, []);

  return (
    <>
      <SearchHeader
        title="Non-Alcoholic Recipes"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <RecipeSearchableList
          items={recipes}
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
