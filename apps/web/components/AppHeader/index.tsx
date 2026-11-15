'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import AppBar from '#/components/AppBar';
import { getRecipeListUrl } from '#/modules/url';

// The titled app bar: the page's name centered in the toolbar row, the
// search link at the right edge, with the mark the shared AppBar renders.

// MUI's IconButton size="large" edge="end": the 48px circle (12px padding
// around the 24px glyph), nudged to the row's right edge by the -12px
// negative margin of the `edge` prop.
const searchButton =
  'flex size-12 shrink-0 items-center justify-center self-center rounded-full transition-colors outline-none hover:bg-white/8 focus-visible:bg-white/12';

export default function AppHeader({
  title,
  underTitle,
}: {
  title: string;
  /** Rendered directly under the page title. */
  underTitle?: ReactNode;
}) {
  return (
    <>
      <AppBar>
        <div className="grow truncate text-center text-xl/[1.6] font-medium">{title}</div>
        <Link
          href={getRecipeListUrl()}
          aria-label="Search"
          className={`${searchButton} -mr-3`}
        >
          <Search className="size-6" />
        </Link>
      </AppBar>
      {underTitle}
    </>
  );
}
