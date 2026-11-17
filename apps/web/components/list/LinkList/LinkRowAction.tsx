'use client';

import { ChevronRight } from 'lucide-react';
import { useLinkStatus } from 'next/link';

// The row's trailing chevron, with the pending-navigation treatment: a
// soft diagonal shine band sweeps across the tapped row while its
// navigation is in flight (a first visit whose prefetch has not landed)
// — subtler than an icon swap, which reads as a jump. Reads the
// link-status context Next's Link provides around its anchor, so it only
// ever runs inside one; a client component of its own keeps LinkList
// itself server-renderable.
export default function LinkRowAction() {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending && (
        // The shine band: a third of the row wide, faint, sweeping on the
        // row-shine keyframes (globals.css). Pointer-events off so the
        // sweep never intercepts a second tap.
        <span
          aria-hidden
          className="animate-row-shine bg-linear-65 from-transparent from-40% via-foreground/8 to-transparent to-60% absolute inset-y-0 left-0 w-1/3 pointer-events-none motion-reduce:animate-none"
        />
      )}
      <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
    </>
  );
}
