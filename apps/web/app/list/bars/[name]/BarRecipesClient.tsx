'use client';

import type { Bar } from '@cocktails/data';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { BarAboutCard } from '#/components/EntityAboutCard';
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import type { RecipeListItem } from '#/modules/recipeListItem';

export default function BarRecipesClient({
  bar,
  recipes,
}: {
  bar: Bar;
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
      <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      {isSearching ? (
        <RecipeSearchableList
          items={recipes}
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
