import { GoogleAnalytics } from '@next/third-parties/google';
// ui-sdk default styles: must load before globals.css so the app's own
// CSS can override them.
import '@ui-sdk/core/web.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import 'core-js/modules/es.object.group-by.js';
// Not nuqs/adapters/next/app: it reads useSearchParams(), which makes every
// page that reads a query param render client-only under `output: 'export'`.
// The React adapter reads location.search after hydration and renders the
// "no params" state on the server, so pages prerender their full content.
// instrumentation-client.ts makes it follow Next router navigations.
import { NuqsAdapter } from 'nuqs/adapters/react';
import AppFooter from '#/components/layout/AppFooter';
import FullscreenHelper from '#/components/layout/FullscreenHelper';
import AppToasts from '#/components/pwa/AppToasts';
import PwaStatus from '#/components/pwa/PwaStatus';
import nightSkyStrip from '../../../public/night-sky-strip.webp';
import tikiBeachDivider from '../../../public/tiki-beach-divider.webp';
import tikiLeavesTop from '../../../public/tiki-leaves-top.webp';

// Space Grotesk: the app's face, picked from the fun-refinements page.
// One latin-only variable file (300–700 covers every weight the app uses —
// 400 body plus a few font-medium; nothing bolds), so the PWA precache
// carries ~22 kb instead of Roboto's 9-subset ~204 kb.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-app',
});

const description =
  'Browse thousands of cocktail recipes from books, bars, YouTube channels and podcasts, with ingredients, substitutes and calculators.';

// Same expression as next.config.ts: the deploy root moves with the base
// path (/cocktails in production, /cocktails/pr-preview/pr-N on PR
// previews). Metadata URLs must follow it, or previews emit links to the
// production site (broken icons, manifest, sitemap, canonicals).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';

// The origin metadata URLs resolve against: the production Pages site by
// default, or the Netlify deploy-preview host on PR builds (netlify.toml
// sets it alongside NEXT_PUBLIC_BASE_PATH, mirrored by preview.yml, so
// canonical/OG URLs point at the URL the preview is actually served
// from).
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://sboudrias.github.io';

// PR preview builds are transient (deleted when their PR closes) and live on
// the preview origin; they must not be indexed. Sitemaps cannot express
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
  metadataBase: `${siteOrigin}${basePath}/`,
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
      <body className={spaceGrotesk.variable}>
        <NuqsAdapter>
          {/* The app shell: a 600px column carrying the night sky as fixed
              background layers, painted here topmost first: the tiki leaves
              at the top, the beach scene anchored to the bottom (its sky
              fades in over ~190px via alpha baked into the webp), and one
              night-sky strip beneath both — an opaque webp holding the sky
              color, the beach-style glowing stars and the amplified cloud
              wisps, with wisps faded to nothing at the column's crop lines
              (75/675) so nothing is sliced against the flat body on
              desktop. The strip is 750px wide, wider than the column, so its
              left/right tile seams stay clipped out of view. */}
          <div
            className="mx-auto flex min-h-screen max-w-[600px] flex-col"
            style={{
              backgroundImage: `url(${tikiLeavesTop.src}), url(${tikiBeachDivider.src}), url(${nightSkyStrip.src})`,
              backgroundSize: 'min(100%,750px) auto, min(100%,750px) auto, 750px auto',
              backgroundPosition: 'center 40px, bottom center, center top',
              backgroundRepeat: 'no-repeat, no-repeat, repeat-y',
            }}
          >
            {/* The one <main> landmark for every page (Lighthouse
                landmark-one-main; from the PWA audit's unmerged fix). */}
            <main className="grow">{children}</main>
            <AppFooter />
          </div>
        </NuqsAdapter>
        <FullscreenHelper />
        {/* The PWA surfaces: the listeners that fire toasts on install
            availability, offline, and service-worker updates, and the one
            host that paints them. */}
        <PwaStatus />
        <AppToasts />
        <GoogleAnalytics gaId="G-XSDN5REM9F" />
      </body>
    </html>
  );
}
