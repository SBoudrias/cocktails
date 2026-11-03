'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeCardItem } from '#/modules/recipeCard';

export default function RecipesClient({ recipes }: { recipes: RecipeCardItem[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const renderRecipe = useCallback(
    (recipe: RecipeCardItem): React.ReactNode => (
      <RecipeLinkListItem
        key={recipe.href}
        href={recipe.href}
        name={recipe.name}
        source={recipe.source}
      />
    ),
    [],
  );

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
      <CardContent>
        <Typography variant="body2">
          No recipes or ingredients matched the search term &quot;{searchTerm}&quot;
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SearchHeader
        title="All Recipes"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={recipes}
        getSearchText={(recipe) => recipe.searchText}
        config={byNameListConfig}
        renderItem={renderRecipe}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
