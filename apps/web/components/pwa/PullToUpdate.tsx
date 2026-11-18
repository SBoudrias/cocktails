'use client';

import { rubberBand } from '@ui-sdk/core/gesture';
import { Check, ChevronDown, LoaderCircle, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { match } from 'ts-pattern';
import { showUpdateToast } from './pwa-toasts';
import './pull-to-update.css';

/**
 * Pull-to-update: in the installed app, a downward pull at the very top
 * slides a glass chip out from behind the app bar; releasing past its
 * threshold asks the service worker to check for a new deploy. A found
 * update rides the existing update toast (the SKIP_WAITING flow PwaStatus
 * drives, or the one fired here for a worker already waiting); when
 * nothing is new the chip itself says "Up to date" — toasts stay for
 * things that need action.
 *
 * Browser tabs keep the browser's own pull-to-refresh: the gesture is
 * display-mode standalone/fullscreen only (installed apps have no native
 * one to fight), and the pull is touch-only, so desktop scroll is
 * untouched. The page itself never moves — the chip carries the pull, so
 * the fixed bar and the sticky headers hold exactly still.
 */

/** Chip travel that arms the release, and its ceiling, in px. */
const THRESHOLD = 56;
const MAX_SHOWN = 112;
/** Finger travel before the chip appears, in px. */
const SLOP = 8;
/** Shortest spin the checking state shows, and how long a verdict stays. */
const CHECK_MS = 450;
const VERDICT_MS = 1_600;

type Phase = 'idle' | 'pull' | 'settle' | 'checking' | 'fresh' | 'offline';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** One check's outcome: a toast is on its way, nothing new, or no network. */
async function checkForUpdate(): Promise<'updating' | 'fresh' | 'offline'> {
  const started = Date.now();
  // The spin never blinks past: whatever the network does, the checking
  // state holds at least CHECK_MS.
  const hold = () => sleep(Math.max(0, CHECK_MS - (Date.now() - started)));
  if (!('serviceWorker' in navigator)) {
    await hold();
    return 'fresh';
  }
  // Nothing can arrive without a connection; don't make the worker try.
  if (!navigator.onLine) {
    await hold();
    return 'offline';
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    // update() resolves once the new script is fetched and installing has
    // begun — give updatefound a beat to land before reading the workers.
    await hold();
    const controlled = navigator.serviceWorker.controller != null;
    if (registration.waiting && controlled) {
      // This worker installed before the pull, so no updatefound fires
      // for it — offer it here (same toast id as PwaStatus's, so it
      // replaces rather than stacks).
      showUpdateToast(registration.waiting);
      return 'updating';
    }
    // An installing worker toasts through PwaStatus once it lands; step
    // aside and let it.
    return registration.installing && controlled ? 'updating' : 'fresh';
  } catch {
    await hold();
    // Safari rejects the update fetch while offline; only call it that
    // when the browser agrees.
    return navigator.onLine ? 'fresh' : 'offline';
  }
}

/** The installed app's display modes, as a store for useSyncExternalStore. */
const INSTALLED_QUERY = '(display-mode: standalone), (display-mode: fullscreen)';

function subscribeInstalled(onChange: () => void) {
  const query = window.matchMedia(INSTALLED_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const isInstalledApp = () => window.matchMedia(INSTALLED_QUERY).matches;

export default function PullToUpdate() {
  const [phase, setPhase] = useState<Phase>('idle');
  // The chip mounts only in the installed app: browser tabs keep none of
  // it in the DOM, and the server snapshot starts false, so the static
  // export ships nothing (and hydration flips to the client's truth).
  const installed = useSyncExternalStore(subscribeInstalled, isInstalledApp, () => false);
  const chipRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  // The touch handlers live in one effect; this is how they read the
  // phase without resubscribing on every change.
  const phaseRef = useRef<Phase>('idle');
  useEffect(() => {
    phaseRef.current = phase;
  });

  useEffect(() => {
    // Where the gesture matters: an installed app has no browser
    // pull-to-refresh of its own, and only there is a service worker
    // guaranteed to be registered (next dev never registers one).
    if (!installed || !('serviceWorker' in navigator)) return;

    let startX = 0;
    let startY = 0;
    let engaged = false;
    let cancelled = false;
    let armed = false;
    let timer = 0;

    const clearTimer = () => {
      if (timer !== 0) {
        clearTimeout(timer);
        timer = 0;
      }
    };

    // The chip follows the finger through the --pull variable: the
    // stylesheet maps it to translate, so its transition owns the ride
    // home (a raw inline translate would race the React commit that
    // flips data-phase).
    const paint = (shown: number, progress: number) => {
      const chip = chipRef.current;
      if (chip) {
        chip.style.setProperty('--pull', `${shown}px`);
        if (armed) chip.dataset.armed = '';
        else delete chip.dataset.armed;
      }
      if (arrowRef.current) {
        // Down at rest, up when armed — release to check.
        arrowRef.current.style.rotate = `${-180 * progress}deg`;
      }
    };

    const drop = () => {
      const chip = chipRef.current;
      if (chip) {
        chip.style.removeProperty('--pull');
        delete chip.dataset.armed;
      }
      if (arrowRef.current) arrowRef.current.style.rotate = '';
    };

    // Back behind the bar, animated by the stylesheet's transition.
    const settle = () => {
      drop();
      setPhase('settle');
      clearTimer();
      timer = window.setTimeout(() => setPhase('idle'), 350);
    };

    const runCheck = () => {
      drop();
      setPhase('checking');
      void checkForUpdate().then((verdict) => {
        match(verdict)
          .with('updating', () => settle())
          .otherwise((state) => {
            setPhase(state);
            clearTimer();
            timer = window.setTimeout(() => setPhase('idle'), VERDICT_MS);
          });
      });
    };

    const atTop = (target: Element) => {
      if (window.scrollY > 1) return false;
      // Any scrollable box between the finger and the window holding
      // content above (the drawer's sheet body, an inner scroller) has
      // first claim on the pull.
      for (
        let el: Element | null = target;
        el !== null && el !== document.documentElement;
        el = el.parentElement
      ) {
        if (el.scrollTop > 0) return false;
      }
      return true;
    };

    const busy = () =>
      phaseRef.current !== 'idle' &&
      phaseRef.current !== 'settle' &&
      phaseRef.current !== 'pull';

    const onTouchStart = (event: TouchEvent) => {
      engaged = false;
      cancelled = false;
      armed = false;
      if (event.touches.length > 1 || busy()) {
        cancelled = true;
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        cancelled = true;
        return;
      }
      // The drawer is its own surface: a pull inside the sheet belongs
      // to the sheet, never to the app behind it.
      if (target.closest('[data-slot="drawer-content"], [data-slot="drawer-backdrop"]')) {
        cancelled = true;
        return;
      }
      if (!atTop(target)) {
        cancelled = true;
        return;
      }
      const first = event.touches[0];
      if (first == null) return;
      startX = first.clientX;
      startY = first.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (cancelled) return;
      // Native took the gesture (iOS marks the moves it owns
      // uncancelable): stand down entirely.
      if (!event.cancelable) {
        if (engaged) settle();
        cancelled = true;
        return;
      }
      if (event.touches.length > 1) {
        if (engaged) settle();
        cancelled = true;
        return;
      }
      const first = event.touches[0];
      if (first == null) return;
      const dx = first.clientX - startX;
      const dy = first.clientY - startY;

      if (!engaged) {
        // A decisive stroke up or sideways is the page's own (scrolling,
        // the video carousel) — stop watching. An undecided diagonal just
        // waits; claiming it would freeze the page under a scroll.
        const up = dy < -SLOP;
        const sideways = Math.abs(dx) > SLOP && Math.abs(dx) > dy;
        if (up || sideways) {
          cancelled = true;
          return;
        }
        // Claim only a clear downward drag, and at its first move past
        // the slop: the first preventDefault is what keeps iOS from
        // handing the rubber-band to the scroll system, after which it
        // stops honoring any.
        if (dy < SLOP || Math.abs(dx) >= dy) return;
        event.preventDefault();
        engaged = true;
        setPhase('pull');
      } else {
        event.preventDefault();
      }

      const shown = Math.min(rubberBand(Math.max(0, dy), window.innerHeight), MAX_SHOWN);
      armed = shown >= THRESHOLD;
      paint(shown, Math.min(1, shown / THRESHOLD));
    };

    const onTouchEnd = () => {
      if (!engaged) {
        cancelled = true;
        return;
      }
      engaged = false;
      cancelled = true;
      if (armed) runCheck();
      else settle();
    };

    const onTouchCancel = () => {
      if (!engaged) {
        cancelled = true;
        return;
      }
      engaged = false;
      cancelled = true;
      settle();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      clearTimer();
    };
  }, [installed]);

  if (!installed) return null;

  return (
    // The wrapper centers the chip over the app column and never takes a
    // pointer; the chip rests behind the fixed app bar (one z-layer
    // under it, slide rule in pull-to-update.css) and slides out below
    // its edge.
    <div
      data-slot="ptr-wrap"
      className="pointer-events-none fixed inset-x-0 top-(--app-bar-height) z-2 flex justify-center"
    >
      <div
        ref={chipRef}
        role="status"
        data-slot="ptr-chip"
        data-phase={phase}
        className="flex items-center gap-1.5 rounded-full border border-border bg-header px-3 py-1 text-sm text-foreground shadow-(--app-bar-shadow) backdrop-blur-sm select-none"
      >
        {match(phase)
          .with('checking', () => (
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ))
          .with('fresh', () => <Check className="size-4 text-ring" aria-hidden />)
          .with('offline', () => <WifiOff className="size-4 text-ring" aria-hidden />)
          .otherwise(() => (
            <ChevronDown
              ref={arrowRef}
              data-slot="ptr-arrow"
              className="size-4 text-foreground/70"
              aria-hidden
            />
          ))}
        {match(phase)
          .with('checking', () => <span>Checking for updates…</span>)
          .with('fresh', () => <span>Up to date</span>)
          .with('offline', () => <span>You’re offline</span>)
          .otherwise(() => null)}
      </div>
    </div>
  );
}
