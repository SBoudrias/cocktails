import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Providers } from './providers';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import FullscreenHelper from '@/components/FullscreenHelper';
import AppFooter from '@/components/AppFooter';
import 'core-js/modules/es.object.group-by.js';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AntdRegistry>
          <Providers>
            {children}
            <AppFooter />
          </Providers>
        </AntdRegistry>
        <FullscreenHelper />
      </body>
      <GoogleAnalytics gaId="G-XSDN5REM9F" />
    </html>
  );
}
