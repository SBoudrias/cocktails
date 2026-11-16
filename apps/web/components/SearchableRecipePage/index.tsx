'use client';

import { ChevronRight } from 'lucide-react';
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
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
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
 * How many skeleton rows to render: enough to fill any likely viewport,
 * clipped to the actual one by CSS. A fixed count renders identically on the
 * server and the client (hydration-safe — no viewport reads at render time),
 * and the wrapper's max-height keeps what shows to one screenful.
 */
const SKELETON_ROWS = 20;

/** One row of the loading skeleton, shaped like the recipe card it stands in
 * for: a text-skeleton look over the same two-line metrics. */
function SkeletonListItem() {
  return (
    <li className="relative flex w-full items-center border-b px-4 py-3 pr-12">
      <span className="flex flex-1 flex-col gap-1">
        <Skeleton className="h-4 w-[55%]" />
        <Skeleton className="h-3 w-[35%]" />
      </span>
      <Skeleton className="h-3.5 w-11" />
      <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
    </li>
  );
}

/**
 * The list area while the catalog loads, or after it failed. The skeleton
 * renders through the same list structure as the loaded state — title
 * subheader, paper, dividers, chevrons — so the catalog filling in is a
 * paint, not a relayout: everything around the placeholder rows keeps its
 * exact position, and the list title ("Recipes using X") is there from the
 * start. A failed fetch surfaces its reload affordance right away.
 */
function CatalogListState({
  failed,
  listHeader,
  recipeCount,
}: {
  failed: boolean;
  listHeader: string;
  recipeCount: number | undefined;
}) {
  if (failed) {
    return (
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Recipes could not be loaded</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Enough placeholders to fill the viewport (or the shorter list, whichever
  // is smaller) — the real list replaces them wholesale, and the CSS cap keeps
  // the placeholder to one screenful on any viewport.
  const skeletonRows = Math.max(1, Math.min(recipeCount ?? 1, SKELETON_ROWS));

  return (
    // data-loading marks any element whose content is still loading, for
    // tests (the flush in vitest.setup waits on it) and future test tooling.
    // The aria-label stays for the accessible name.
    <div aria-label="Loading recipes" data-loading>
      <LinkList
        header={listHeader}
        items={Array.from({ length: skeletonRows }, (_, row) => row)}
        renderItem={(row) => <SkeletonListItem key={row} />}
      />
    </div>
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
  underTitle,
  children,
  footer,
}: {
  title?: string;
  /** Rendered under the header's title (the category page's pill row). */
  underTitle?: ReactNode;
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

  return (
    <>
      {!fromCatalog && allRecipes.length === 0 && title != null ? (
        <AppHeader title={title} underTitle={underTitle} />
      ) : (
        <SearchHeader
          title={title}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          underTitle={underTitle}
        />
      )}
      {!isSearching && children}
      {catalogLoading ? (
        <CatalogListState
          failed={failed}
          listHeader={listHeader}
          recipeCount={recipeCount}
        />
      ) : (
        allRecipes.length > 0 &&
        (isSearching ? (
          <RecipeSearchableList
            items={allRecipes}
            renderItem={renderRecipe}
            searchTerm={searchTerm}
            emptyState={
              <>
                <Card className="m-4">
                  <CardHeader>
                    <CardTitle>No results found</CardTitle>
                  </CardHeader>
                </Card>
                <SearchAllLink searchTerm={searchTerm} />
              </>
            }
          />
        ) : (
          <LinkList header={listHeader} items={allRecipes} renderItem={renderRecipe} />
        ))
      )}
      {!isSearching && footer}
    </>
  );
}
