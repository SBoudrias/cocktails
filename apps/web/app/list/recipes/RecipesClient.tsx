'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import LetterNav from '#/components/LetterNav';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchHeader from '#/components/SearchHeader';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeListItem } from '#/modules/recipeListItem';

export default function RecipesClient({
  recipes,
  letters,
}: {
  recipes: RecipeListItem[];
  letters: { slug: string; label: string }[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const renderRecipe = useCallback(
    (recipe: RecipeListItem): React.ReactNode => (
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
      {/* Static entry points to each letter of the list. */}
      {!searchTerm && <LetterNav letters={letters} />}
      <RecipeSearchableList
        items={recipes}
        config={byNameListConfig}
        renderItem={renderRecipe}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
