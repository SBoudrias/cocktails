'use client';

import { ChevronRight, LoaderCircle } from 'lucide-react';
import { useLinkStatus } from 'next/link';

// The chevron of a row that links somewhere, swapped for a small spinner
// while that link's navigation is in flight (a first visit whose prefetch
// has not landed). Reads the link-status context Next's Link provides
// around its anchor, so it only ever runs inside one; a client component
// of its own keeps LinkList itself server-renderable.
export default function LinkRowAction() {
  const { pending } = useLinkStatus();

  return pending ? (
    <LoaderCircle
      aria-label="Opening"
      className="absolute top-1/2 right-4 size-6 -translate-y-1/2 animate-spin text-foreground"
    />
  ) : (
    <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
  );
}
