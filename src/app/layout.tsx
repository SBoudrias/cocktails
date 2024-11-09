import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import FullscreenHelper from '@/components/FullscreenHelper';
import AppFooter from '@/components/AppFooter';
import 'core-js/modules/es.object.group-by.js';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
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
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NuqsAdapter>{children}</NuqsAdapter>
            <AppFooter />
          </ThemeProvider>
        </AppRouterCacheProvider>
        <FullscreenHelper />
      </body>
      <GoogleAnalytics gaId="G-XSDN5REM9F" />
    </html>
  );
}
