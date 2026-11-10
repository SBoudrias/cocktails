import { enableHistorySync } from 'nuqs/adapters/react';

// Next.js runs this file in the browser before the app hydrates: global
// client-side setup goes here.

// The layout's nuqs React adapter only sees URL changes made by nuqs itself.
// Next's router changes the URL through history.pushState/replaceState (links,
// router.replace in /search): patch them so nuqs state follows those
// navigations too.
enableHistorySync();

// Register the service worker (public/sw.js). Same scope as the app: with the
// /cocktails basePath the SW lives at /cocktails/sw.js and controls the app's
// pages and assets only. Registration is the same under a preview basePath,
// since the base path is mirrored in this module too. Next runs this file in
// the browser only, but the navigator read stays guarded so the module also
// loads cleanly outside a browser (static analysis, SSR-ish tooling).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails';
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(`${basePath}/sw.js`)
    .catch((error: unknown) =>
      console.error('service worker registration failed', error),
    );
}
