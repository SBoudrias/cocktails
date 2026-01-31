'use client';

import type { Recipe, Source } from '@cocktails/data';
import { LinkList, LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import SourceAboutCard from '#/components/SourceAboutCard';
import useNameIsUnique from '#/hooks/useNameIsUnique';
import { getRecipeAttribution } from '#/modules/getRecipeAttribution';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';

export default function SourceClient({
  source,
  recipes,
}: {
  source: Source;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const nameIsUnique = useNameIsUnique(recipes);

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      const href = getRecipeUrl(recipe);
      return (
        <LinkListItem
          key={href}
          href={href}
          primary={recipe.name}
          secondary={
            nameIsUnique(recipe)
              ? undefined
              : getRecipeAttribution(recipe, { exclude: { source: source.name } })
          }
        />
      );
    },
    [nameIsUnique, source.name],
  );

  return (
    <>
      <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      {isSearching ? (
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
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
