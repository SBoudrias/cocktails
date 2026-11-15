'use client';

import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import EntitySuggestions from '#/components/EntitySuggestions';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchHeader from '#/components/SearchHeader';
import VirtualGroupedList from '#/components/VirtualGroupedList';
import { useSearchIndex } from '#/hooks/useSearchIndex';
import { getEntitySuggestions } from '#/modules/entitySuggestions';
import { byNameListConfig } from '#/modules/lists/by-name';
import { groupByName } from '#/modules/lists/groupByName';
import type { getRecipeUrl } from '#/modules/url';
import { isRecipeUrl } from '#/modules/url';

type Row = { href: ReturnType<typeof getRecipeUrl>; name: string; source: string };

/**
 * The whole A–Z list of recipes, as one virtualized list. The static HTML
 * carries the first letters; every other row comes from the shared search
 * index, which this page loads right away.
 */
export default function RecipesClient({
  groups: initialGroups,
  initialRecipes,
}: {
  groups: { label: string; count: number }[];
  initialRecipes: Row[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const index = useSearchIndex({ urgent: true });

  const { groups, recipes } = useMemo(() => {
    if (index == null) return { groups: initialGroups, recipes: initialRecipes };

    const indexGroups = groupByName(
      Object.entries(index).flatMap(([href, entry]) =>
        isRecipeUrl(href) && 'source' in entry
          ? [{ href, name: entry.name, source: entry.source }]
          : [],
      ),
    );
    return {
      groups: indexGroups.map((group) => ({
        label: group.label,
        count: group.items.length,
      })),
      recipes: indexGroups.flatMap((group) => group.items),
    };
  }, [index, initialGroups, initialRecipes]);

  // While the index has not loaded, no suggestions: the recipes below still
  // match by name, and the section appears once the index lands.
  const entitySuggestions = useMemo(
    () => getEntitySuggestions(index, searchTerm),
    [index, searchTerm],
  );

  const renderRecipe = useCallback(
    (recipe: Row): React.ReactNode => (
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
      {searchTerm ? (
        <>
          <EntitySuggestions suggestions={entitySuggestions} />
          <RecipeSearchableList
            items={recipes}
            config={byNameListConfig}
            renderItem={renderRecipe}
            searchTerm={searchTerm}
            emptyState={emptyState}
          />
        </>
      ) : (
        <VirtualGroupedList groups={groups} items={recipes} renderItem={renderRecipe} />
      )}
    </>
  );
}
