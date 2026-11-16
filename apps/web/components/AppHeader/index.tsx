'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import AppBar from '#/components/AppBar';
import { iconButton } from '#/components/AppBar/icon-button';
import { getRecipeListUrl } from '#/modules/url';

// The titled app bar: the page's name centered in the toolbar row, the
// search link at the right edge, with the mark the shared AppBar renders.
// The search button: a 48px circle (12px padding around the 24px glyph),
// nudged to the row's right edge by a -12px negative margin.

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
          className={`${iconButton} size-12 -mr-3`}
        >
          <Search className="size-6" />
        </Link>
      </AppBar>
      {underTitle}
    </>
  );
}
