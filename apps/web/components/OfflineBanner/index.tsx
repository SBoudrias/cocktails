'use client';

import { CloudOff } from '@mui/icons-material';
import { Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * A quiet "you are offline" note when the browser loses connectivity —
 * the app's lists and cached pages keep working, so this explains the
 * state instead of blocking anything. It appears once per offline spell
 * (not on every navigation) and leaves by itself when back online.
 */
export default function OfflineBanner() {
  // Read at first render (a lazy initializer, so the server render gets a
  // false), then follow the browser's own online/offline events. Never
  // setState in the effect itself: the events are the only updates.
  const [offline, setOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  );

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <Snackbar
      open={offline}
      // Offline can last for a whole session; never auto-hide it, but it is
      // informational — any other interaction just proceeds underneath.
      autoHideDuration={null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message="You are offline — visited pages and lists still work."
      action={
        // Decorative: the message text says it all, so the icon stays out
        // of the tab order and screen readers.
        <CloudOff aria-hidden fontSize="small" sx={{ opacity: 0.7 }} />
      }
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
    />
  );
}
