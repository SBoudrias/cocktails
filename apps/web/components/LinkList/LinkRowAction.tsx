'use client';

import ChevronRight from '@mui/icons-material/ChevronRight';
import { CircularProgress } from '@mui/material';
import { useLinkStatus } from 'next/link';

/**
 * The chevron of a row that links somewhere, swapped for a small spinner
 * while that link's navigation is in flight (a first visit to a route whose
 * prefetch has not landed yet). Reads the link-status context Next's `Link`
 * provides around its anchor, so it only ever runs inside one.
 *
 * A client component of its own so LinkList itself stays server-renderable:
 * the rows are baked into the static HTML; only this little action (and the
 * Link around it) hydrate.
 */
export default function LinkRowAction() {
  const { pending } = useLinkStatus();

  return pending ? <CircularProgress size={20} aria-label="Opening" /> : <ChevronRight />;
}
