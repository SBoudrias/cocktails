import { toast } from '@ui-sdk/react/toast';

/** The offline note's id: replaced while offline, dismissed when back. */
const OFFLINE_ID = 'pwa-offline';
/** The update note's id: replaced if a new worker waits again. */
const UPDATE_ID = 'pwa-update';
/** The install hint's id: Chrome re-fires beforeinstallprompt (e.g. after
 * a prevented prompt), and each firing must replace the hint, not stack
 * another one. */
const INSTALL_ID = 'pwa-install';
/** sessionStorage key: a dismissal hides the install hint for the session. */
const INSTALL_DISMISSED = 'pwa:install-hint-dismissed';

/** The non-standard event Chrome/Android fires when the app is installable
 * but not installed yet. Not in the DOM lib; only the surface used here. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && typeof event.prompt === 'function';
}

/** Whether the update toast is up right now. The live queue is the truth,
 * so an update that timed out, was swiped away or was acted on stops
 * holding the install hint back the moment it is gone. */
const updateToastShowing = () => toast.toasts().some((item) => item.id === UPDATE_ID);

function installDismissed(): boolean {
  try {
    return sessionStorage.getItem(INSTALL_DISMISSED) === 'true';
  } catch {
    return false;
  }
}

function rememberInstallDismissal(): void {
  try {
    sessionStorage.setItem(INSTALL_DISMISSED, 'true');
  } catch {
    // Private mode: at least this page's session keeps it dismissed.
  }
}

/** The opt-in install hint: the browser's own install UI, offered once per
 * session when it fires beforeinstallprompt (never on iOS, which has no
 * programmatic install — its path is the Share menu), never in standalone,
 * gone for the session after any dismissal, and deferred while an update
 * toast is up — the update is about correctness, the hint is a nicety, and
 * Chrome re-fires the event later (and after the update's reload), so the
 * hint waits for a beat when it has the stage alone. */
export function showInstallToast(event: Event): void {
  if (!isInstallPrompt(event)) return;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return;
  if (installDismissed()) return;

  // Hold the browser's own mini-infobar back until the user asks; it would
  // otherwise nag on every visit.
  event.preventDefault();

  if (updateToastShowing()) return;

  // The title stays short enough to share its row with the buttons; the
  // rest of the sentence rides below as the description.
  toast('Install Indexotica?', {
    id: INSTALL_ID,
    description: 'On this device, works offline.',
    duration: 12_000,
    action: {
      label: 'Install',
      onAction: async () => {
        rememberInstallDismissal();
        await event.prompt();
      },
    },
    cancel: { label: 'Not now', onCancel: rememberInstallDismissal },
  });
}

/** The quiet offline note: it stays while offline (visited pages and the
 * precached catalog still work — it explains a state, blocks nothing) and
 * leaves by itself when the connection returns; a dismiss affordance
 * lets someone who got the point clear it early. */
export function showOfflineToast(): void {
  toast('You are offline', {
    id: OFFLINE_ID,
    description: 'Visited pages and lists still work.',
    duration: Infinity,
    cancel: { label: 'Dismiss' },
  });
}

export function hideOfflineToast(): void {
  toast.dismiss(OFFLINE_ID);
}

/** The update note: a new deploy's service worker has installed and is
 * waiting; one tap picks it up now instead of at the next launch. Skipped
 * while offline (nothing new can arrive) and in dev (no SW registered).
 * It outranks the install hint — a deploy is about correctness, a hint
 * about nicety — so any standing hint steps down (Chrome re-fires
 * beforeinstallprompt after the update's reload, so it returns on its
 * own). The offline note may share the stack: it is environmental
 * state, not an offer competing for the same decision. */
export function showUpdateToast(worker: ServiceWorker): void {
  toast.dismiss(INSTALL_ID);
  toast('A new version is available', {
    id: UPDATE_ID,
    duration: 20_000,
    action: {
      label: 'Update',
      onAction: () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      },
    },
  });
}
