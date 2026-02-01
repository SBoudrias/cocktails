import type { Metadata, Viewport } from 'next';
import { Box } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Roboto } from 'next/font/google';
import 'core-js/modules/es.object.group-by.js';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import AppFooter from '#/components/AppFooter';
import FullscreenHelper from '#/components/FullscreenHelper';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-prefers-color-scheme="dark">
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
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NuqsAdapter>
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {children}
                <AppFooter />
              </Box>
            </NuqsAdapter>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <FullscreenHelper />
      </body>
      <GoogleAnalytics gaId="G-XSDN5REM9F" />
    </html>
  );
}
