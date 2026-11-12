'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TikiMark from '#/components/TikiMark';
import { buttonVariants } from '#/components/ui/button-variants';
import { getRecipeListUrl } from '#/modules/url';

const iconLink = buttonVariants({
  variant: 'ghost',
  size: 'icon-lg',
  className: 'size-12 rounded-full [&_svg:not([class*=size-])]:size-6',
});
// The brand mark's button is wider, like MUI's large IconButton around a
// 32px icon.
const homeLink = `${iconLink} size-14`;

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  // The brand mark is still the MUI SvgIcon the footer shares; it sizes
  // from its font size.
  const mark = <TikiMark sx={{ fontSize: 32 }} />;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1100] bg-header text-foreground shadow-md backdrop-blur-md">
        <div className="flex h-(--app-bar-height) items-center px-1 min-[600px]:px-3">
          {isHome ? (
            <span className="inline-flex size-14 items-center justify-center">
              {mark}
            </span>
          ) : (
            <Link href="/" aria-label="Go to home" className={homeLink}>
              {mark}
            </Link>
          )}
          <div className="min-w-0 flex-1 truncate text-center text-xl leading-[1.6] font-medium">
            {title}
          </div>
          <Link href={getRecipeListUrl()} aria-label="Search" className={iconLink}>
            <Search />
          </Link>
        </div>
      </header>
      <div className="h-(--app-bar-height)" />
    </>
  );
}
