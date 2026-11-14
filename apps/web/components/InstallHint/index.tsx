'use client';

import { Close, InstallMobile } from '@mui/icons-material';
import { Button, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

/** sessionStorage key, namespaced like the other local storage users. */
const DISMISSED_KEY = 'cocktail-index:install-hint-dismissed';

/**
 * The non-standard event Chrome/Android fires when the app is installable
 * but not installed yet. Not in the DOM lib; only the surface used here.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** Narrow an `Event` listener parameter to the install-prompt surface. */
function isInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function';
}

/**
 * A bottom hint offering the native app install — the browser's own
 * `beforeinstallprompt` flow where it exists (Chrome, Edge, Android);
 * iOS Safari has no programmatic install, fires no such event, and is
 * served by the dedicated apple-touch-icon instead.
 *
 * Deliberately quiet: never in the standalone app, never after a dismissal
 * this session, never in the first seconds after load, and it closes on its
 * own. It points at the OS's own install UI rather than reimplementing it,
 * so the website and the app stay the same thing.
 */
export default function InstallHint({ showAfterMs = 4000 }: { showAfterMs?: number }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Already installed (any platform's standalone display mode): nothing
    // to offer. Optional-chained: happy-dom in tests has no matchMedia.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const dismissed = () => {
      try {
        return sessionStorage.getItem(DISMISSED_KEY) === 'true';
      } catch {
        return false;
      }
    };

    const onBeforeInstallPrompt = (event: Event) => {
      if (!isInstallPrompt(event)) return;
      // Hold the browser's own mini-infobar back until the user asks; it
      // would otherwise nag on every visit.
      event.preventDefault();
      if (!dismissed()) setEvent(event);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!event) return;
    // Let the page settle before offering anything. The prop is a test
    // seam: same behavior, no wait.
    const timer = setTimeout(() => setOpen(true), showAfterMs);
    return () => clearTimeout(timer);
  }, [event, showAfterMs]);

  const rememberDismissal = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Private mode: at least this component instance stays closed.
    }
  };

  const dismiss = () => {
    rememberDismissal();
    setOpen(false);
  };

  const install = () => {
    rememberDismissal();
    setOpen(false);
    void event?.prompt().then(() => setEvent(null));
  };

  if (!open) return null;

  return (
    <Snackbar
      open
      autoHideDuration={12_000}
      onClose={dismiss}
      message="Install Cocktail Index on this device?"
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
        <>
          <Button
            color="primary"
            size="small"
            onClick={install}
            startIcon={<InstallMobile />}
          >
            Install
          </Button>
          <Button color="inherit" size="small" onClick={dismiss} endIcon={<Close />}>
            Not now
          </Button>
        </>
      }
    />
  );
}
