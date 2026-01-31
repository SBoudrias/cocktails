'use client';

import type { Recipe } from '@cocktails/data';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import useNameIsUnique from '#/hooks/useNameIsUnique';
import { getRecipeAttribution } from '#/modules/getRecipeAttribution';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';

export default function RecipesClient({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const nameIsUnique = useNameIsUnique(recipes);
  const renderRecipe = useCallback(
    (recipe: Recipe): React.ReactNode => {
      const href = getRecipeUrl(recipe);
      return (
        <LinkListItem
          // Using href as key since recipe `slug`s aren't unique
          key={href}
          href={href}
          primary={recipe.name}
          secondary={nameIsUnique(recipe) ? undefined : getRecipeAttribution(recipe)}
        />
      );
    },
    [nameIsUnique],
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
        getSearchText={getRecipeSearchText}
        config={byNameListConfig}
        renderItem={renderRecipe}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
