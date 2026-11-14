import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '#/components/AppHeader';
import TikiMark from '#/components/TikiMark';

export const metadata: Metadata = {
  title: 'Offline | Indexotica',
  // The offline fallback is an internal SW page, not site content: keep it
  // out of search indexes and the sitemap (also excluded in
  // next-sitemap.config.js).
  robots: { index: false },
};

/**
 * The offline fallback the service worker serves for navigations that are
 * neither reachable nor cached. A server-rendered page like any other: it
 * works offline because every _next/ asset it loads is precached.
 */
export default function OfflinePage() {
  return (
    <>
      <AppHeader title="Indexotica" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          pt: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <TikiMark variant="detailed" sx={{ fontSize: 64, opacity: 0.5 }} />
        <Typography variant="h5" component="h1">
          You are offline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
          This page is not available without a connection, and you have not visited it
          before. Pages you have opened recently still work offline.
        </Typography>
        <Link href="/list/recipes" style={{ textDecoration: 'none' }}>
          <Typography variant="body1" color="primary">
            Go to all recipes
          </Typography>
        </Link>
      </Box>
    </>
  );
}
