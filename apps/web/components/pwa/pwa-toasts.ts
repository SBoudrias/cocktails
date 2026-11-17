import { toast } from '@ui-sdk/react/toast';

/** The offline note's id: replaced while offline, dismissed when back. */
const OFFLINE_ID = 'pwa-offline';
/** The update note's id: replaced if a new worker waits again. */
const UPDATE_ID = 'pwa-update';
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
 * gone for the session after any dismissal. */
export function showInstallToast(event: Event): void {
  if (!isInstallPrompt(event)) return;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return;
  if (installDismissed()) return;

  // Hold the browser's own mini-infobar back until the user asks; it would
  // otherwise nag on every visit.
  event.preventDefault();

  toast('Install Indexotica on this device?', {
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
 * while offline (nothing new can arrive) and in dev (no SW registered). */
export function showUpdateToast(worker: ServiceWorker): void {
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
