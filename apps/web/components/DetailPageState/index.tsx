'use client';

import Link from 'next/link';
import { match } from 'ts-pattern';
import AppHeader from '#/components/AppHeader';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { getRecipeListUrl } from '#/modules/url';

/**
 * A detail page without its data: while its type's data file loads (what
 * the exported shell's HTML shows before its script runs), after the file
 * failed to load (with a reload affordance), or when the file holds no
 * entry for the page's path (a stale or mistyped URL — every URL of the
 * route serves the same shell, so the host cannot answer 404 itself).
 */
export default function DetailPageState({
  state,
}: {
  state: 'loading' | 'failed' | 'missing';
}) {
  return match(state)
    .with('loading', () => (
      <>
        <AppHeader title="" />
        {/* data-loading marks content still loading, for tests (the flush
            in vitest.setup waits on it); the aria-label is its name. */}
        <div aria-label="Loading page" data-loading className="flex flex-col gap-3 p-4">
          <Skeleton className="h-6 w-[60%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
      </>
    ))
    .with('failed', () => (
      <>
        <AppHeader title="Indexotica" />
        <Card className="m-2">
          <CardHeader>
            <CardTitle>This page could not be loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Reload the page
            </Button>
          </CardContent>
        </Card>
      </>
    ))
    .with('missing', () => (
      <>
        <AppHeader title="Indexotica" />
        {/* Laid out like the offline fallback page (app/offline). */}
        <div className="flex flex-col items-center gap-4 px-4 pt-16 text-center">
          <h1 className="text-2xl leading-8 font-normal">This page does not exist</h1>
          <Link href={getRecipeListUrl()} className="text-base text-primary">
            Go to all recipes
          </Link>
        </div>
      </>
    ))
    .exhaustive();
}
