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

function renderRecipe(recipe: Recipe, authorName: string) {
  // Get the attribution if the recipe was adapted by someone else
  const adaptedBy = recipe.attributions.find(
    (attribution) =>
      attribution.relation === 'adapted by' && attribution.source !== authorName,
  );

  const href = getRecipeUrl(recipe);
  return (
    <LinkListItem
      key={href}
      href={href}
      primary={recipe.name}
      secondary={adaptedBy ? `Adapted by ${adaptedBy.source}` : undefined}
    />
  );
}

export default function AuthorRecipesClient({
  authorName,
  recipes,
}: {
  authorName: string;
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

  const renderItem = (recipe: Recipe) => renderRecipe(recipe, authorName);

  return (
    <>
      <SearchHeader
        title={`Recipes by ${authorName}`}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {isSearching ? (
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderItem}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      ) : (
        <LinkList header="All Recipes" items={recipes} renderItem={renderItem} />
      )}
    </>
  );
}
