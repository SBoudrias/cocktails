import { enableHistorySync } from 'nuqs/adapters/react';

// Next.js runs this file in the browser before the app hydrates: global
// client-side setup goes here.

// The layout's nuqs React adapter only sees URL changes made by nuqs itself.
// Next's router changes the URL through history.pushState/replaceState (links,
// router.replace in /search): patch them so nuqs state follows those
// navigations too.
enableHistorySync();
