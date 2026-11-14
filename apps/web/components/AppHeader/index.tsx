'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import TikiMark from '#/components/TikiMark';
import { getRecipeListUrl } from '#/modules/url';

// The fixed app bar: MUI's AppBar (glass fill, 8px blur, elevation-4 shadow)
// around a Toolbar row — the mark at the left edge, the title centered, the
// search at the right. The spacer div below reserves the toolbar's height so
// page content starts under the bar, never behind it.

// MUI's IconButton edge buttons as utility classes: size="large" is a 56px
// circle (12px padding around a 32px icon — the mark); the search button is
// the 48px one MUI's SvgIcon yields (12px padding around the 24px glyph).
// Both are nudged to the row's edge by the -12px negative margins of MUI's
// `edge` prop.
const markButton =
  'flex size-14 shrink-0 items-center justify-center self-center rounded-full transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none hover:bg-white/8 focus-visible:bg-white/12 aria-disabled:cursor-default aria-disabled:pointer-events-none aria-disabled:text-white/30';
const searchButton =
  'flex size-12 shrink-0 items-center justify-center self-center rounded-full transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none hover:bg-white/8 focus-visible:bg-white/12';

export default function AppHeader({
  title,
  underTitle,
}: {
  title: string;
  /** Rendered directly under the page title. */
  underTitle?: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1100] flex flex-col bg-[color:var(--header)] bg-[image:linear-gradient(rgba(255,255,255,0.092),rgba(255,255,255,0.092))] shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.2),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_1px_10px_0px_rgba(0,0,0,0.12)] backdrop-blur-[8px]">
        <div className="flex min-h-[var(--app-bar-height)] items-center px-4 min-[600px]:px-6">
          {isHome ? (
            <button
              type="button"
              aria-disabled="true"
              tabIndex={-1}
              className={`${markButton} -ml-3`}
            >
              <TikiMark size={32} />
            </button>
          ) : (
            <Link href="/" aria-label="Go to home" className={`${markButton} -ml-3`}>
              <TikiMark size={32} />
            </Link>
          )}
          <div className="grow shrink truncate text-center text-xl font-medium leading-[1.6]">
            {title}
          </div>
          <Link
            href={getRecipeListUrl()}
            aria-label="Search"
            className={`${searchButton} -mr-3`}
          >
            <Search className="size-6 text-foreground" />
          </Link>
        </div>
      </header>
      {/* the toolbar's height, so content starts below the fixed bar */}
      <div className="min-h-[var(--app-bar-height)]" />
      {underTitle}
    </>
  );
}
