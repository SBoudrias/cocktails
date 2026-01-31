'use client';

import { getRecipeListUrl } from '#/modules/url';
import { Home, Search } from '@mui/icons-material';
import { AppBar, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppBar>
        <Toolbar>
          {isHome ? (
            <IconButton size="large" edge="start" disabled>
              <Icon />
            </IconButton>
          ) : (
            <IconButton size="large" edge="start" aria-label="Go to home" href="/">
              <Home />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            textAlign="center"
            sx={{ flexGrow: 1, flexShrink: 1 }}
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
