'use client';

import { rubberBand } from '@ui-sdk/core/gesture';
import { Check, ChevronDown, LoaderCircle, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { match } from 'ts-pattern';
import './pull-to-update.css';

/**
 * Pull-to-update: in the installed app, a downward pull at the very top
 * slides a glass chip out from behind the app bar; releasing past its
 * threshold refreshes the app — kick the service worker's update check,
 * then reload the page. The reload is the fix's heart: an installed app
 * can sit on its rendered DOM for days (iOS suspends it rather than
 * closing), so a pull that only asked the worker found a current SW,
 * said "Up to date" and left yesterday's homepage on screen. sw.js
 * serves navigations network-first with cache: 'no-cache', so the
 * reload always lands on the origin's current bytes, never the CDN's
 * max-age window. A worker still waiting rides the existing update
 * toast instead (the SKIP_WAITING flow; toasts stay for things that
 * need action); offline, the chip says so and nothing is asked.
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

type Phase = 'idle' | 'pull' | 'settle' | 'checking' | 'refresh' | 'offline';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** One pull's outcome: the app is refreshing, or there is no network. */
async function refreshApp(): Promise<'refresh' | 'offline'> {
  const started = Date.now();
  // The spin never blinks past: whatever the network does, the checking
  // state holds at least CHECK_MS.
  const hold = () => sleep(Math.max(0, CHECK_MS - (Date.now() - started)));
  // Nothing can arrive without a connection; don't make the worker try.
  if (!navigator.onLine) {
    await hold();
    return 'offline';
  }
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      // The worker's own update check first: sw.js is fetched past the
      // HTTP cache (updateViaCache: 'none' at registration), so a pull
      // minutes after a deploy sees the new worker, not Pages'
      // max-age=600 window on it. update() resolves once the new script
      // is fetched and installing has begun — or at once if it matches.
      await registration.update();
      // A worker still waiting (its install's skipWaiting has not landed
      // as this worker's activation) takes over now, so the reload below
      // is served by the new deploy's worker.
      if (navigator.serviceWorker.controller && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  } catch {
    // Safari rejects the update fetch while offline; a pull that lost the
    // connection mid-check must not reload into a cache-served page while
    // claiming a refresh — report offline and keep the page as it is.
    await hold();
    if (!navigator.onLine) return 'offline';
  }
  await hold();
  // The refresh itself. An installed app can sit on its rendered DOM for
  // days — iOS suspends it rather than closing — so a worker that is
  // already current changes nothing on screen until the page reloads.
  // The worker serves navigations network-first with cache: 'no-cache',
  // so the reload lands on the origin's current bytes even inside the
  // CDN's 10-minute max-age window on the document.
  window.location.reload();
  return 'refresh';
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
      void refreshApp().then((verdict) => {
        setPhase(verdict);
        clearTimer();
        timer = window.setTimeout(() => setPhase('idle'), VERDICT_MS);
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
          .with('refresh', () => <Check className="size-4 text-ring" aria-hidden />)
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
          .with('refresh', () => <span>Refreshing…</span>)
          .with('offline', () => <span>You’re offline</span>)
          .otherwise(() => null)}
      </div>
    </div>
  );
}
