'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useMemo } from 'react';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import { useSearchIndex } from '#/hooks/useSearchIndex';
import type { SearchIndexEntry } from '#/modules/buildSearchIndex';
import type { getRecipeUrl } from '#/modules/url';
import { isRecipeUrl } from '#/modules/url';

type IndexedRecipe = SearchIndexEntry & { href: ReturnType<typeof getRecipeUrl> };

function renderRecipe(recipe: IndexedRecipe) {
  return (
    <RecipeLinkListItem
      key={recipe.href}
      href={recipe.href}
      name={recipe.name}
      source={recipe.source}
    />
  );
}

function getSearchText(recipe: IndexedRecipe) {
  return recipe.searchText;
}

/**
 * Search results over every recipe, from the shared search index: the recipe
 * list is split in letter pages, so no single page holds every recipe.
 */
export default function AllRecipesSearch({ searchTerm }: { searchTerm: string }) {
  const index = useSearchIndex({ urgent: true });
  const recipes = useMemo(
    () =>
      Object.entries(index ?? {}).flatMap(([href, entry]): IndexedRecipe[] =>
        isRecipeUrl(href) ? [{ ...entry, href }] : [],
      ),
    [index],
  );

  if (index == null) {
    return (
      <Card role="status" sx={{ m: 2 }}>
        <CardHeader title="Searching all recipes…" />
      </Card>
    );
  }

  return (
    <SearchableList
      items={recipes}
      getSearchText={getSearchText}
      renderItem={renderRecipe}
      searchTerm={searchTerm}
      emptyState={
        <Card sx={{ m: 2 }}>
          <CardHeader title="No results found" />
          <CardContent>
            <Typography variant="body2">
              No recipes or ingredients matched the search term &quot;{searchTerm}&quot;
            </Typography>
          </CardContent>
        </Card>
      }
    />
  );
}
