'use client';

import { Search } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import TikiMark from '#/components/TikiMark';
import { getRecipeListUrl } from '#/modules/url';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppBar>
        <Toolbar>
          {isHome ? (
            <IconButton size="large" edge="start" disabled>
              <TikiMark sx={{ fontSize: 32 }} />
            </IconButton>
          ) : (
            <IconButton size="large" edge="start" aria-label="Go to home" href="/">
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
