'use client';

import { Button, Card, CardContent, CardHeader, CircularProgress } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import AppHeader from '#/components/AppHeader';
import { LinkList } from '#/components/LinkList';
import Quantity from '#/components/Quantity';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { useSharedJson } from '#/hooks/useSharedJson';
import { getCatalogList, getLoadedCatalog, loadCatalog } from '#/modules/catalog';
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

/** The state of a catalog-driven list: fetching, failed, or neither. */
function CatalogListState({ failed }: { failed: boolean }) {
  return failed ? (
    <Card sx={{ m: 1 }}>
      <CardHeader title="Recipes could not be loaded" />
      <CardContent>
        <Button onClick={() => window.location.reload()}>Reload the page</Button>
      </CardContent>
    </Card>
  ) : (
    <Card sx={{ m: 1 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} aria-label="Loading recipes" />
        Loading recipes…
      </CardContent>
    </Card>
  );
}

/**
 * The search island of a page listing recipes: the search header, and the
 * page's recipes, searchable through the shared search index.
 *
 * The page's other content comes from the server as `children` (above the
 * recipe list) and `footer` (below it); both hide while a search is active,
 * when the search results replace the page.
 *
 * Where the page passes `recipes`, those rows ship baked in the static HTML.
 * Where it passes `catalogKey` instead, the whole list resolves at runtime
 * from the shared catalog (fetched once per session, shared across pages) —
 * including inside a search, which matches the full list rather than a partial
 * one. Until the fetch lands a loading state stands in (a failed fetch
 * surfaces a reload affordance); a page whose catalog key the catalog does
 * not carry renders no list.
 */
export default function SearchableRecipePage({
  title,
  recipes,
  catalogKey,
  listHeader,
  children,
  footer,
}: {
  title?: string;
  /** Rows baked into the static HTML; catalog-driven pages omit this. */
  recipes?: (RecipeListItem | QuantityRecipeListItem)[];
  /** The page's key in the shared catalog, to render its list from there. */
  catalogKey?: string;
  listHeader: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const isSearching = searchTerm != null && searchTerm.trim() !== '';
  const fromCatalog = catalogKey != null;

  const { value: catalog, failed } = useSharedJson({
    load: loadCatalog,
    getLoaded: getLoadedCatalog,
    enabled: fromCatalog,
    // The list is the page's main content, so it loads right away rather
    // than waiting for idle time (search on it covers only the catalog).
    urgent: true,
  });

  const allRecipes = useMemo(() => {
    if (catalogKey == null) return recipes ?? [];

    return getCatalogList(catalog, catalogKey);
  }, [recipes, catalogKey, catalog]);

  const catalogLoading = fromCatalog && catalog == null;

  const body = catalogLoading ? (
    <CatalogListState failed={failed} />
  ) : allRecipes.length > 0 ? (
    isSearching ? (
      <RecipeSearchableList
        items={allRecipes}
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
      <LinkList header={listHeader} items={allRecipes} renderItem={renderRecipe} />
    )
  ) : null;

  return (
    <>
      {!fromCatalog && allRecipes.length === 0 && title != null ? (
        <AppHeader title={title} />
      ) : (
        <SearchHeader
          title={title}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
      {isSearching ? (
        body
      ) : (
        <>
          {children}
          {body}
          {footer}
        </>
      )}
    </>
  );
}
