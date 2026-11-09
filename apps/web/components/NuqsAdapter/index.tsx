'use client';

import { NuqsAdapter as NuqsReactAdapter, enableHistorySync } from 'nuqs/adapters/react';

// Next's router changes the URL through history.pushState/replaceState (links,
// router.replace in /search). Patch them so nuqs state follows those navigations.
// The patch is a no-op on the server, where `history` doesn't exist.
enableHistorySync();

/**
 * URL state for the whole app.
 *
 * nuqs's `next/app` adapter reads `useSearchParams()`, which under
 * `output: 'export'` turns every page that reads a query param into a
 * client-only render: the static HTML ships an empty shell. The React adapter
 * reads `location.search` through `useSyncExternalStore` instead, and renders
 * the "no params" state on the server. Pages prerender their full content and
 * apply `?search=` after hydration.
 */
export default function NuqsAdapter({ children }: { children: React.ReactNode }) {
  return <NuqsReactAdapter>{children}</NuqsReactAdapter>;
}
