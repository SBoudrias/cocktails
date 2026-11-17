'use client';

import { ChevronRight } from 'lucide-react';
import { useLinkStatus } from 'next/link';

// The row's trailing chevron plus its press feedback. Every tappable row
// carries a shine band: one sweep on press (the active state), and a
// gentle repeating sweep while a navigation is pending (a first visit
// whose prefetch has not landed — Next's Link-status context), so the
// tap is acknowledged without the jump of an icon swap. A client
// component of its own keeps LinkList itself server-renderable.
export default function LinkRowAction() {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        aria-hidden
        className={
          // The band starts translated off the row's left edge (clipped
          // by the row's own overflow) and crosses once on press, or
          // keeps sweeping while the navigation is pending.
          // motion-reduce: no sweep at all.
          'pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-linear-65 from-transparent from-40% via-foreground/8 to-transparent to-60% ' +
          (pending
            ? 'animate-row-shine motion-reduce:animate-none'
            : 'group-active/row:animate-row-shine-once motion-reduce:group-active/row:animate-none')
        }
      />
      <ChevronRight className="absolute top-1/2 right-4 size-6 -translate-y-1/2 text-foreground" />
    </>
  );
}
