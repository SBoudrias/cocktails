'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeListItem } from './recipeListItem';

const getSearchText = (item: RecipeListItem) => item.searchText;
const secondaryTypographyProps = {
  variant: 'caption',
  sx: { lineHeight: 1.35 },
} as const;

export default function RecipesClient({
  recipeListItems,
}: {
  recipeListItems: RecipeListItem[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const renderRecipe = useCallback(
    (recipe: RecipeListItem): React.ReactNode => (
      <LinkListItem
        key={recipe.href}
        href={recipe.href}
        primary={recipe.name}
        secondary={recipe.secondary}
        secondaryTypographyProps={secondaryTypographyProps}
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
        items={recipeListItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderRecipe}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
