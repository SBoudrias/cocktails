import { getAllCategories } from '@cocktails/data/categories';
import { getAllSources } from '@cocktails/data/sources';
import { Box } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import 'core-js/modules/es.object.group-by.js';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import AppFooter from '#/components/AppFooter';
import AppSidebar from '#/components/AppSidebar';
import FullscreenHelper from '#/components/FullscreenHelper';
import SearchShortcut from '#/components/SearchShortcut';
import tikiBeachDivider from '../../../public/tiki-beach-divider.png';
import tikiLeavesTop from '../../../public/tiki-leaves-top.png';
import theme from './theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  manifest: `/cocktails/manifest.webmanifest`,
  title: 'Cocktail Index',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, sources] = await Promise.all([getAllCategories(), getAllSources()]);

  // The sidebar shows roots plus the active subtype, so bookmarked category
  // pages keep their location context without expanding the entire catalogue.
  const sidebarCategories = categories.map(({ slug, name, categoryType, parents }) => ({
    slug,
    name,
    categoryType,
    parents: parents.map((parent) => parent.slug),
  }));

  const sidebarSources = sources.map(({ slug, name, type }) => ({ slug, name, type }));
  return (
    <html lang="en" data-prefers-color-scheme="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/cocktails/sitemap.xml"
        />
      </head>
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme} defaultMode="dark" storageManager={null}>
            <CssBaseline />
            <NuqsAdapter>
              <Box
                component="a"
                href="#main-content"
                sx={{
                  position: 'fixed',
                  top: 8,
                  left: 8,
                  zIndex: 'tooltip',
                  px: 2,
                  py: 1,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-200%)',
                  '&:focus-visible': { transform: 'none' },
                }}
              >
                Skip to content
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  maxWidth: { xs: 600, md: 1200 },
                  mx: 'auto',
                  minHeight: '100vh',
                }}
              >
                <AppSidebar categories={sidebarCategories} sources={sidebarSources} />
                <Box
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundImage: `url(${tikiLeavesTop.src}), url(${tikiBeachDivider.src})`,
                    backgroundSize: `min(100%, ${tikiLeavesTop.width}px) auto, min(100%, ${tikiBeachDivider.width}px) auto`,
                    backgroundPosition: 'center 40px, bottom center',
                    backgroundRepeat: 'no-repeat, no-repeat',
                  }}
                >
                  <Box
                    component="main"
                    id="main-content"
                    tabIndex={-1}
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      scrollMarginTop: 80,
                      maxWidth: { xs: 600, md: 720 },
                      width: '100%',
                      mx: 'auto',
                    }}
                  >
                    {children}
                  </Box>
                  <AppFooter />
                </Box>
              </Box>
            </NuqsAdapter>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <FullscreenHelper />
        <SearchShortcut />
      </body>
      <GoogleAnalytics gaId="G-XSDN5REM9F" />
    </html>
  );
}
