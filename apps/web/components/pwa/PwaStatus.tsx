'use client';

import { useEffect, useState } from 'react';
import {
  hideOfflineToast,
  showInstallToast,
  showOfflineToast,
  showUpdateToast,
} from './pwa-toasts';

/**
 * The PWA status listeners, mounted once near the root (next to AppToasts,
 * which paints what these fire): the install hint on beforeinstallprompt,
 * the offline note on connectivity changes, and the update note when a new
 * service worker has installed and is waiting. The toasts themselves live
 * in pwa-toasts.ts — this component only wires events to them.
 */
export default function PwaStatus() {
  // The banner's initial state, from the browser's own connectivity; the
  // online/offline events update it from there.
  const [offline, setOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  );

  useEffect(() => {
    // The events mean what they say (reading navigator.onLine in the
    // handler can race the browser updating it).
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', showInstallToast);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', showInstallToast);
    };
  }, []);

  // The offline toast follows the state, not the events: both events and
  // remounts land here, exactly once per transition.
  useEffect(() => {
    if (offline) showOfflineToast();
    else hideOfflineToast();
  }, [offline]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          // A controller exists only on a second visit: this is an update
          // for someone already running the app, not the first install.
          const waiting = registration?.waiting ?? installing;
          if (waiting) showUpdateToast(waiting);
        }
      });
    };

    void navigator.serviceWorker.ready
      .then((ready) => {
        registration = ready;
        // An update may already be waiting when this mounts.
        if (ready.waiting && navigator.serviceWorker.controller) {
          showUpdateToast(ready.waiting);
        }
        ready.addEventListener('updatefound', onUpdateFound);
      })
      .catch(() => {
        // Registration is production-only; this listener is a no-op there.
      });

    return () => {
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  return null;
}
