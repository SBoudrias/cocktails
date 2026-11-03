'use client';

import type { Source } from '@cocktails/data';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import SourceAboutCard from '#/components/SourceAboutCard';
import type { RecipeCardItem } from '#/modules/recipeCard';

export default function SourceClient({
  source,
  recipes,
}: {
  source: Source;
  recipes: RecipeCardItem[];
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

  const renderRecipe = useCallback((recipe: RecipeCardItem) => {
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
        <SearchableList
          items={recipes}
          getSearchText={(recipe) => recipe.searchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <>
          <SourceAboutCard source={source} sx={{ m: 2 }} />
          {recipes.length > 0 && (
            <LinkList header="All Recipes" items={recipes} renderItem={renderRecipe} />
          )}
        </>
      )}
    </>
  );
}
