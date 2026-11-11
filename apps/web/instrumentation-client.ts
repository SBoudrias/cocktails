import { enableHistorySync } from 'nuqs/adapters/react';

// Next.js runs this file in the browser before the app hydrates: global
// client-side setup goes here.

// The layout's nuqs React adapter only sees URL changes made by nuqs itself.
// Next's router changes the URL through history.pushState/replaceState (links,
// router.replace in /search): patch them so nuqs state follows those
// navigations too.
enableHistorySync();

// Register the service worker (public/sw.js), production only: under
// `next dev` the fetch handler would cache-first Turbopack's dev chunks
// (keyed by module path, not content), serving stale code after edits —
// painful to debug and persistent across dev sessions on localhost.
//
// Same scope as the app: with the /cocktails basePath the SW lives at
// /cocktails/sw.js and controls the app's pages and assets only.
// Registration is the same under a preview basePath, since the base path is
// mirrored in this module too.
//
// The explicit path (not the Next.js guide's `new URL('../sw.js',
// import.meta.url)`) is required by the static export: this module ships in
// hashed chunks under /cocktails/_next/static/chunks/, so import.meta.url
// resolves to a chunk URL, not the site root; and the deploy root moves with
// the basePath (/cocktails, or /cocktails/pr-preview/pr-N on PRs).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';
if (
  process.env.NODE_ENV === 'production' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  navigator.serviceWorker
    .register(`${basePath}/sw.js`, { updateViaCache: 'none' })
    .catch((error: unknown) =>
      console.error('service worker registration failed', error),
    );
}
