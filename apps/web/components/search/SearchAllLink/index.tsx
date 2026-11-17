'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { Card, CardContent } from '#/components/ui/card';

// The escape hatch of an empty search: the same term searched across every
// page. Server pages omit `searchTerm` — the link reads the ?search URL
// parameter itself; client islands managing the term pass it down.
export default function SearchAllLink({ searchTerm }: { searchTerm?: string | null }) {
  const [urlSearchTerm] = useQueryState('search');
  const term = searchTerm !== undefined ? searchTerm : urlSearchTerm;

  if (!term || term.trim() === '') {
    return null;
  }

  return (
    <Card m={2}>
      <CardContent>
        <Link
          href={{ pathname: '/search', query: { search: term } }}
          className="flex items-center justify-between text-sm text-muted-foreground"
        >
          Not finding what you&apos;re looking for? Search all recipes
          <ChevronRight className="size-6" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
