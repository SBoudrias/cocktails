'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import type { Recipe } from '@/types/Recipe';
import { LinkList, LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchAllLink from '@/components/SearchAllLink';
import SearchHeader from '@/components/SearchHeader';
import { getRecipeSearchText } from '@/modules/searchText';
import { getRecipeUrl } from '@/modules/url';

function renderRecipe(recipe: Recipe) {
  const href = getRecipeUrl(recipe);
  return <LinkListItem key={href} href={href} primary={recipe.name} />;
}

export default function BarRecipesClient({
  barName,
  recipes,
}: {
  barName: string;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  return (
    <>
      <SearchHeader
        title={`Recipes from ${barName}`}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <LinkList header="All Recipes" items={recipes} renderItem={renderRecipe} />
      )}
    </>
  );
}
