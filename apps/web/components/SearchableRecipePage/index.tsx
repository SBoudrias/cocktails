'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import AppHeader from '#/components/AppHeader';
import { LinkList } from '#/components/LinkList';
import Quantity from '#/components/Quantity';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import type { QuantityRecipeListItem, RecipeListItem } from '#/modules/recipeListItem';

function renderRecipe(recipe: RecipeListItem | QuantityRecipeListItem) {
  const quantity = 'quantity' in recipe ? recipe.quantity : undefined;

  return (
    <RecipeLinkListItem
      key={recipe.href}
      href={recipe.href}
      name={recipe.name}
      source={recipe.source}
      tertiary={quantity && <Quantity quantity={quantity} preferredUnit="oz" />}
    />
  );
}

/**
 * The search island of a page listing recipes: the search header, and the
 * page's recipes, searchable through the shared search index.
 *
 * The page's other content comes from the server as `children` (above the
 * recipe list) and `footer` (below it); both hide while a search is active,
 * when the search results replace the page. The recipe list itself renders
 * here, from props: it is big, and server-rendered rows would ship twice
 * (once as client props for search, once as a server component tree).
 */
export default function SearchableRecipePage({
  title,
  recipes,
  listHeader,
  children,
  footer,
}: {
  title?: string;
  recipes: (RecipeListItem | QuantityRecipeListItem)[];
  listHeader: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  return (
    <>
      {recipes.length === 0 && title != null ? (
        <AppHeader title={title} />
      ) : (
        <SearchHeader
          title={title}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
      {isSearching ? (
        <RecipeSearchableList
          items={recipes}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={
            <>
              <Card sx={{ m: 2 }}>
                <CardHeader title="No results found" />
              </Card>
              <SearchAllLink searchTerm={searchTerm} />
            </>
          }
        />
      ) : (
        <>
          {children}
          {recipes.length > 0 && (
            <LinkList header={listHeader} items={recipes} renderItem={renderRecipe} />
          )}
          {footer}
        </>
      )}
    </>
  );
}
