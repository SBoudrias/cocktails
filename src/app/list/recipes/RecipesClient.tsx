'use client';

import type { Recipe } from '@/types/Recipe';
import { useMemo } from 'react';
import { getRecipeSearchText } from '@/modules/searchText';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import RecipeList from '@/components/RecipeList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';

export default function RecipesClient({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const nameIsUnique = useMemo(() => {
    const store = Object.groupBy(recipes, (recipe) => recipe.name.toLowerCase());
    return (name: string) => store[name.toLowerCase()]?.length === 1;
  }, [recipes]);

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
          <RecipeList recipes={items} header={header} isNameUniqueFn={nameIsUnique} />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
