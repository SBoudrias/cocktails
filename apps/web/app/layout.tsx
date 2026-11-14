import { Box } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import 'core-js/modules/es.object.group-by.js';
// Not nuqs/adapters/next/app: it reads useSearchParams(), which makes every
// page that reads a query param render client-only under `output: 'export'`.
// The React adapter reads location.search after hydration and renders the
// "no params" state on the server, so pages prerender their full content.
// instrumentation-client.ts makes it follow Next router navigations.
import { NuqsAdapter } from 'nuqs/adapters/react';
import AppFooter from '#/components/AppFooter';
import FullscreenHelper from '#/components/FullscreenHelper';
import InstallHint from '#/components/InstallHint';
import OfflineBanner from '#/components/OfflineBanner';
import UpdateToast from '#/components/UpdateToast';
import tikiBeachDivider from '../../../public/tiki-beach-divider.webp';
import tikiLeavesTop from '../../../public/tiki-leaves-top.webp';
import theme from './theme';

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const description =
  'Browse thousands of cocktail recipes from books, bars, YouTube channels and podcasts, with ingredients, substitutes and calculators.';

// Same expression as next.config.ts: the deploy root moves with the base
// path (/cocktails in production, /cocktails/pr-preview/pr-N on PR
// previews). Metadata URLs must follow it, or previews emit links to the
// production site (broken icons, manifest, sitemap, canonicals).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';

// PR preview builds are transient (swept when their PR closes) and live on
// the production origin; they must not be indexed. Sitemaps cannot express
// that — next-sitemap's siteUrl is the production URL in every build, so
// preview sitemaps list production URLs only, and excluding pr-preview paths
// there would be a no-op. noindex on the page level is the mechanism that
// actually stops crawlers from picking preview URLs up.
const isPreview = basePath.includes('/pr-preview/');

export const metadata: Metadata = {
  // A plain string, not `new URL(...)`: metadataBase accepts either, and
  // building a URL object from the env-derived basePath reads as a runtime
  // URL to static analysis (react-doctor's no-unguarded-throwing-parse-call),
  // though it is evaluated at build time and cannot actually throw.
  metadataBase: `https://sboudrias.github.io${basePath}/`,
  ...(isPreview ? { robots: { index: false } } : {}),
  manifest: `${basePath}/manifest.webmanifest`,
  title: 'Indexotica: Tiki & Cocktails',
  description,
  alternates: { canonical: './' },
  openGraph: {
    siteName: 'Indexotica',
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary' },
  icons: {
    // The favicon <link> comes from the app/favicon.ico file convention;
    // only the apple-touch-icon is new here.
    apple: [
      {
        url: `${basePath}/icons/apple-touch-icon.png`,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
  themeColor: '#0A1420',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-prefers-color-scheme="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href={`${basePath}/sitemap.xml`}
        />
      </head>
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme} defaultMode="dark" storageManager={null}>
            <CssBaseline />
            <NuqsAdapter>
              <Box
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundImage: `url(${tikiLeavesTop.src}), url(${tikiBeachDivider.src})`,
                  backgroundSize: `min(100%, ${tikiLeavesTop.width}px) auto, min(100%, ${tikiBeachDivider.width}px) auto`,
                  backgroundPosition: 'center 40px, bottom center',
                  backgroundRepeat: 'no-repeat, no-repeat',
                }}
              >
                <Box component="main" sx={{ flexGrow: 1 }}>
                  {children}
                </Box>
                <AppFooter />
              </Box>
            </NuqsAdapter>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <FullscreenHelper />
        <OfflineBanner />
        <UpdateToast />
        <InstallHint />
        <GoogleAnalytics gaId="G-XSDN5REM9F" />
      </body>
    </html>
  );
}
