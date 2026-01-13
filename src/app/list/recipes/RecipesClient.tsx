'use client';

import type { Recipe } from '@/types/Recipe';
import { getRecipeSearchText } from '@/modules/searchText';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import RecipeList, { getRecipeAttribution } from '@/components/RecipeList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import { useCallback } from 'react';
import { LinkListItem } from '@/components/LinkList';
import { getRecipeUrl } from '@/modules/url';

export default function RecipesClient({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const nameIsUnique = useNameIsUnique(recipes);
  const renderRecipe = useCallback(
    (recipe: Recipe): React.ReactNode => {
      return (
        <LinkListItem
          key={recipe.slug}
          href={getRecipeUrl(recipe)}
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
        renderItem={(items, header) => (
          <RecipeList recipes={items} header={header} renderRecipe={renderRecipe} />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
