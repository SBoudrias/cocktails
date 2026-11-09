'use client';

import SearchHeader from './index';

/**
 * Static stand-in for `SearchHeader`, used as the `<Suspense>` fallback of pages
 * that read the `search` query param. Those pages bail out to client-side rendering
 * (the query string is unknown at build time), so without a fallback the static HTML
 * has no header or title at all.
 */
export default function SearchHeaderFallback({ title }: { title?: string }) {
  return <SearchHeader title={title} searchTerm={null} onSearchChange={() => {}} />;
}
