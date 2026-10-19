'use client';

import type { Bar, Recipe } from '@cocktails/data';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { BarAboutCard } from '#/components/EntityAboutCard';
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

export default function BarRecipesClient({
  bar,
  recipes,
}: {
  bar: Bar;
  recipes: Recipe[];
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

  const renderRecipe = useCallback((recipe: Recipe) => {
    const href = getRecipeUrl(recipe);
    return (
      <RecipeLinkListItem
        key={href}
        href={href}
        name={recipe.name}
        source={getRecipeSource(recipe)}
      />
    );
  }, []);

  return (
    <>
      <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      {isSearching ? (
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <>
          <BarAboutCard bar={bar} sx={{ m: 2 }} />
          <LinkList
            header={`Recipes from ${bar.name}`}
            items={recipes}
            renderItem={renderRecipe}
          />
        </>
      )}
    </>
  );
}
