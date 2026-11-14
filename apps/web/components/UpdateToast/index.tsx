'use client';

import { Button, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * A new deploy's service worker takes over only on the next launch, so a
 * returning visitor can sit on a stale shell for days. When an updated
 * worker has finished installing, this offers one quiet reload to pick it
 * up now. Hidden while offline — there is nothing new to get.
 */
export default function UpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  // Read at first render (a lazy initializer, so the server render gets a
  // false), then follow the browser's own online/offline events.
  const [offline, setOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  );

  useEffect(() => {
    const updateOffline = () => setOffline(!navigator.onLine);
    window.addEventListener('online', updateOffline);
    window.addEventListener('offline', updateOffline);
    return () => {
      window.removeEventListener('online', updateOffline);
      window.removeEventListener('offline', updateOffline);
    };
  }, []);

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
          setWaiting(registration?.waiting ?? installing);
        }
      });
    };

    void navigator.serviceWorker.ready
      .then((ready) => {
        registration = ready;
        // An update may already be waiting when this component mounts.
        if (ready.waiting && navigator.serviceWorker.controller) {
          setWaiting(ready.waiting);
        }
        ready.addEventListener('updatefound', onUpdateFound);
      })
      .catch(() => {
        // Registration is production-only; this toast is a no-op elsewhere.
      });

    return () => {
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  const reload = () => {
    // The new worker is installed and waiting; tell it to skip the rest of
    // the wait, then pick it up with a fresh page load.
    waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <Snackbar
      open={waiting != null && !offline}
      autoHideDuration={20_000}
      message="A new version is available."
      slotProps={{
        // The app's surfaces are translucent dark navy with a blur (the
        // app bar and papers); the default snackbar's flat black does not
        // belong to this app.
        content: {
          sx: (theme) => ({
            backgroundColor: 'rgba(10, 20, 32, 0.9)',
            backdropFilter: 'blur(8px)',
            backgroundImage: 'none',
            color: (theme.vars ?? theme).palette.text.primary,
            border: 1,
            borderColor: (theme.vars ?? theme).palette.divider,
          }),
        },
      }}
      action={
        <Button color="primary" size="small" onClick={reload}>
          Update
        </Button>
      }
    />
  );
}
