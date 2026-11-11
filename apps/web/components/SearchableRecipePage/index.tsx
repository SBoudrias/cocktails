'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
} from '@mui/material';
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

/**
 * How many skeleton rows the placeholder renders at most: enough to fill the
 * first screens and match the typical list, without rendering a thousand
 * placeholders for the giants. The real list replaces it wholesale.
 */
const LOADING_SKELETON_MAX_ROWS = 20;

/**
 * The list area while the catalog loads, or after it failed: one skeleton row
 * per recipe the page knows it has (the server counts them; the number ships
 * with the page), so the reserved height matches the list that lands on it
 * and nothing below the list jumps. A failed fetch surfaces its reload
 * affordance right away.
 */
function CatalogListState({
  failed,
  recipeCount,
}: {
  failed: boolean;
  recipeCount: number | undefined;
}) {
  if (failed) {
    return (
      <Card sx={{ m: 1 }}>
        <CardHeader title="Recipes could not be loaded" />
        <CardContent>
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
        </CardContent>
      </Card>
    );
  }

  const skeletonRows = Math.max(1, Math.min(recipeCount ?? 1, LOADING_SKELETON_MAX_ROWS));

  return (
    <Card sx={{ m: 1 }} aria-label="Loading recipes">
      <CardContent>
        <Stack spacing={2}>
          {Array.from({ length: skeletonRows }, (_, row) => (
            <Stack key={row} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Skeleton variant="text" sx={{ fontSize: '1rem', flex: 1 }} />
              <Skeleton variant="text" sx={{ fontSize: '0.75rem', width: 48 }} />
              <Skeleton variant="circular" width={20} height={20} />
            </Stack>
          ))}
        </Stack>
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
  recipeCount,
  listHeader,
  children,
  footer,
}: {
  title?: string;
  /** Rows baked into the static HTML; catalog-driven pages omit this. */
  recipes?: (RecipeListItem | QuantityRecipeListItem)[];
  /** The page's key in the shared catalog, to render its list from there. */
  catalogKey?: string;
  /** How many recipes the page has, known from the data without any rows. */
  recipeCount?: number;
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
    <CatalogListState failed={failed} recipeCount={recipeCount} />
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
