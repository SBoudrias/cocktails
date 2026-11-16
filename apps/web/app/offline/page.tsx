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
      <main className="flex flex-col items-center gap-4 px-4 pt-16 text-center">
        <TikiMark variant="detailed" size={64} opacity={0.5} />
        <h1 className="text-2xl leading-8 font-normal">You are offline</h1>
        <p className="max-w-[420px] text-base">
          This page is not available without a connection, and you have not visited it
          before. Pages you have opened recently still work offline.
        </p>
        <Link href={{ pathname: '/list/recipes' }}>
          {/* The base layer's anchors stay undecorated; MUI's Typography
              carried the primary color (probed on the baseline). */}
          <p className="text-base text-primary">Go to all recipes</p>
        </Link>
      </main>
    </>
  );
}
