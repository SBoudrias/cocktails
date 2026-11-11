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
import { useEffect, useMemo, useState } from 'react';
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
 * How long a catalog fetch may take before the skeleton shows. The list is
 * session-cached and HTTP-cached, so most visits render at once; flashing a
 * placeholder for those would be its own jank.
 */
const LOADING_SKELETON_DELAY_MS = 300;

/**
 * The list area while the catalog loads, or after it failed. The space is
 * reserved from the first paint (nothing below the list jumps); the skeleton
 * rows show only once the fetch has gone on long enough to warrant them. A
 * failed fetch surfaces its reload affordance right away.
 */
function CatalogListState({ failed, visible }: { failed: boolean; visible: boolean }) {
  if (failed) {
    return (
      <Box sx={{ m: 1, minHeight: 160 }}>
        <Card>
          <CardHeader title="Recipes could not be loaded" />
          <CardContent>
            <Button onClick={() => window.location.reload()}>Reload the page</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ m: 1, minHeight: 216 }} aria-label="Loading recipes">
      {visible && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {[0, 1, 2].map((row) => (
                <Stack
                  key={row}
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: 'center' }}
                >
                  <Skeleton variant="text" sx={{ fontSize: '1rem', flex: 1 }} />
                  <Skeleton variant="text" sx={{ fontSize: '0.75rem', width: 48 }} />
                  <Skeleton variant="circular" width={20} height={20} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
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

  // The skeleton waits a beat before showing, so a fast fetch never flashes
  // it; the reserved space below needs no wait.
  const [skeletonVisible, setSkeletonVisible] = useState(false);
  useEffect(() => {
    if (!catalogLoading || failed) return;

    const timer = setTimeout(() => setSkeletonVisible(true), LOADING_SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [catalogLoading, failed]);

  const body = catalogLoading ? (
    <CatalogListState failed={failed} visible={skeletonVisible} />
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
