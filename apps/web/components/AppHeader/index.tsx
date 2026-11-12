'use client';

import { Search } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TikiMark from '#/components/TikiMark';
import { getRecipeListUrl } from '#/modules/url';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppBar
        sx={{
          // viewport-fit=cover lets the page paint under the status bar on
          // notched phones; the toolbar must sit below the safe area.
          pt: 'var(--safe-area-inset-top)',
          // Left/right edges overlap the curved screen corners in landscape.
          pl: 'var(--safe-area-inset-left)',
          pr: 'var(--safe-area-inset-right)',
        }}
      >
        <Toolbar>
          {isHome ? (
            // The placeholder keeps the title centered on the home page
            // (the logo button's slot, with nothing to go back to). Labeled
            // even though disabled: an unlabeled button fails the
            // accessible-name audit either way.
            <IconButton
              size="large"
              edge="start"
              disabled
              aria-label="Cocktail Index"
            >
              <TikiMark sx={{ fontSize: 32 }} />
>>>>>>> 655bf764c487c (fix(web): a11y landmarks and labels from the PWA audit)
            </IconButton>
          ) : (
            <IconButton
              size="large"
              edge="start"
              aria-label="Go to home"
              component={Link}
              href="/"
            >
              <TikiMark sx={{ fontSize: 32 }} />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, flexShrink: 1, textAlign: 'center' }}
          >
            {title}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="Search"
            component={Link}
            href={getRecipeListUrl()}
          >
            <Search />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
