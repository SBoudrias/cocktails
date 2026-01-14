'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import type { Recipe } from '@/types/Recipe';
import { LinkListItem } from '@/components/LinkList';
import RecipeList, { getRecipeAttribution } from '@/components/RecipeList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import { getRecipeSearchText } from '@/modules/searchText';
import { getRecipeUrl } from '@/modules/url';

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
        renderItem={(items, header) => (
          <RecipeList recipes={items} header={header} renderRecipe={renderRecipe} />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
