import { screen, waitFor } from '@testing-library/react';
import { toast } from '@ui-sdk/react/toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import PullToUpdate from './PullToUpdate';

/**
 * The pull-to-update gesture, driven as real touch sequences on the
 * window. happy-dom carries no layout, so the rubber-banded distance is
 * computed by the same formula the component uses against
 * window.innerHeight (768 in this environment): a 200px drag shows ~96px
 * (past the 56px threshold), a 30px one ~16px (under it).
 *
 * The pull's verdict is conditional: the release probes the origin's
 * current copy of the page (fetch stubbed to serve the probe HTML) and
 * compares deploy stamps — an unchanged deploy says "Up to date" without
 * reloading; a changed, unstamped or unreadable one reloads.
 * window.location.reload() is stubbed: happy-dom's own would tear the
 * document down mid-test.
 */

const stubbedRegistration = { update: vi.fn() };

/** The app shell's body, plus a finger helper: touch sequences on it. */
const shell = () => document.body;

function fingerAt(target: Element, clientX: number, clientY: number): Touch {
  return new Touch({ identifier: 1, target, clientX, clientY });
}

function fireTouch(
  target: Element,
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touch: Touch,
) {
  target.dispatchEvent(
    new TouchEvent(type, {
      touches: [touch],
      changedTouches: [touch],
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** A pull held at `dy` px down (optionally `dx` sideways), not released. */
function pullTo(target: Element, dy: number, dx = 0) {
  const start = fingerAt(target, 100, 100);
  fireTouch(target, 'touchstart', start);
  fireTouch(target, 'touchmove', fingerAt(target, 100 + dx, 100 + dy));
}

function release(target: Element, dy: number, dx = 0) {
  fireTouch(target, 'touchend', fingerAt(target, 100 + dx, 100 + dy));
}

/** The full gesture, start to release. */
function pullAndRelease(target: Element, dy: number, dx = 0) {
  pullTo(target, dy, dx);
  release(target, dy, dx);
}

/** Mounts the component as the installed app would see it.
 * The chip is fetched by its slot attribute, not role: importing
 * pwa-toasts installs ui-sdk's own page-level announcers (a second
 * role="status"), so a role query matches two elements. */
async function mountInstalled() {
  await setupApp(<PullToUpdate />);
  return await waitFor(() => {
    const chip = document.querySelector<HTMLElement>('[data-slot="ptr-chip"]');
    if (chip == null) throw new Error('chip did not mount');
    return chip;
  });
}

/** Stubs the service worker layer the refresh talks to. */
function stubServiceWorker({
  waiting,
  controlled = true,
}: {
  waiting?: ServiceWorker;
  controlled?: boolean;
} = {}) {
  stubbedRegistration.update.mockResolvedValue(undefined);
  const registration = {
    update: stubbedRegistration.update,
    waiting: waiting ?? null,
    // The refresh reads only these two fields.
  } as unknown as ServiceWorkerRegistration;
  const controller = controlled ? ({} as ServiceWorker) : undefined;
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(registration), controller },
    configurable: true,
  });
}

// happy-dom's reload would tear the document down mid-test; stub it and
// assert on it — the reload is the pull's whole outcome.
const reload = vi.fn();
Object.defineProperty(window.location, 'reload', {
  value: reload,
  configurable: true,
});

/** What the origin currently serves for this page, as the probe sees it. */
const serveProbe = (html: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, text: () => Promise.resolve(html) })),
  );

/** Stamps the page on screen with a deploy version. */
function stampCurrentPage(version: string) {
  const meta = document.createElement('meta');
  meta.name = 'deploy-version';
  meta.content = version;
  document.head.append(meta);
  return meta;
}

/** The stamp a deployed page carries in its head. */
const stampedHtml = (version: string) =>
  `<!doctype html><html><head><meta name="deploy-version" content="${version}"/></head><body></body></html>`;

const realScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
const withScrollY = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
};
const resetScrollY = () => {
  if (realScrollY) Object.defineProperty(window, 'scrollY', realScrollY);
};

const realOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
const withOnLine = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
};
const resetOnLine = () => {
  if (realOnLine) Object.defineProperty(navigator, 'onLine', realOnLine);
};

/** matchMedia, mocked: `standalone` decides the display-mode queries. */
let standalone = false;
beforeEach(() => {
  standalone = false;
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: standalone && query.includes('display-mode'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
});

describe('pull to update', () => {
  afterEach(() => {
    toast.dismiss();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    stubbedRegistration.update.mockReset();
    reload.mockClear();
    // The stamp a test planted on the page and its fetch spy: neither
    // may leak into the next test's document or window.
    document.querySelector('meta[name="deploy-version"]')?.remove();
    vi.restoreAllMocks();
    resetScrollY();
    resetOnLine();
  });

  it('mounts nothing in a browser tab', async () => {
    stubServiceWorker();
    await setupApp(<PullToUpdate />);

    expect(document.querySelector('[data-slot="ptr-chip"]')).toBeNull();
    pullAndRelease(shell(), 200);
    expect(document.querySelector('[data-slot="ptr-chip"]')).toBeNull();
  });

  it('drags the chip out and back, without checking, on a short pull', async () => {
    standalone = true;
    stubServiceWorker();
    const chip = await mountInstalled();

    pullTo(shell(), 30);
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'pull'));
    // Below the threshold: visible but not armed.
    expect(chip.style.getPropertyValue('--pull')).toMatch(/^1[0-9.]+px$/);
    expect(chip).not.toHaveAttribute('data-armed');

    release(shell(), 30);
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'settle'));
    expect(chip.style.getPropertyValue('--pull')).toBe('');
    expect(stubbedRegistration.update).not.toHaveBeenCalled();
  });

  it('refreshes the app on release past the threshold', async () => {
    standalone = true;
    stubServiceWorker();
    // The origin now serves a newer deploy than the page on screen.
    stampCurrentPage('old-deploy');
    serveProbe(stampedHtml('new-deploy'));
    const chip = await mountInstalled();

    pullTo(shell(), 200);
    await waitFor(() => expect(chip).toHaveAttribute('data-armed'));

    release(shell(), 200);
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'checking'));
    // The worker check kicks first, then the changed page reloads.
    await waitFor(() => expect(stubbedRegistration.update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(chip).toHaveTextContent('Refreshing…'));
    expect(chip).toHaveAttribute('data-phase', 'refresh');
  });

  it('tells a waiting worker to skip waiting, then reloads', async () => {
    standalone = true;
    const postMessage = vi.fn();
    const waiting = { postMessage } as unknown as ServiceWorker;
    stubServiceWorker({ waiting });
    stampCurrentPage('old-deploy');
    serveProbe(stampedHtml('new-deploy'));
    const chip = await mountInstalled();

    pullAndRelease(shell(), 200);

    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' }),
    );
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    // The chip steps aside for the refresh.
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'refresh'));
  });

  it('says up to date, without reloading, when the deploy did not change', async () => {
    standalone = true;
    stubServiceWorker();
    // The origin serves the same deploy the page on screen came from.
    stampCurrentPage('same-deploy');
    serveProbe(stampedHtml('same-deploy'));
    const chip = await mountInstalled();

    pullAndRelease(shell(), 200);

    await waitFor(() => expect(stubbedRegistration.update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(chip).toHaveTextContent('Up to date'));
    expect(chip).toHaveAttribute('data-phase', 'fresh');
    expect(reload).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('region', { name: 'Notifications' }),
    ).not.toBeInTheDocument();
  });

  it('reloads when the page cannot prove it is current', async () => {
    standalone = true;
    stubServiceWorker();
    // A page from before stamps shipped (no stamp on screen) must read
    // as changed — the pull is a refresh unless proven otherwise.
    serveProbe(stampedHtml('v1'));
    const chip = await mountInstalled();

    pullAndRelease(shell(), 200);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(chip).toHaveAttribute('data-phase', 'refresh');
  });

  it('stays quiet offline, without asking the worker', async () => {
    standalone = true;
    stubServiceWorker();
    withOnLine(false);
    const chip = await mountInstalled();

    pullAndRelease(shell(), 200);

    await waitFor(() => expect(chip).toHaveTextContent('You’re offline'));
    expect(stubbedRegistration.update).not.toHaveBeenCalled();
  });

  it('ignores the pull when the page is scrolled', async () => {
    standalone = true;
    stubServiceWorker();
    await mountInstalled();
    withScrollY(50);

    pullAndRelease(shell(), 200);

    expect(stubbedRegistration.update).not.toHaveBeenCalled();
  });

  it('ignores the pull inside the drawer sheet', async () => {
    standalone = true;
    stubServiceWorker();
    await mountInstalled();
    const sheet = document.createElement('div');
    sheet.setAttribute('data-slot', 'drawer-content');
    document.body.append(sheet);

    pullAndRelease(sheet, 200);

    expect(stubbedRegistration.update).not.toHaveBeenCalled();
    sheet.remove();
  });

  it('ignores the pull when an inner scroller holds content above', async () => {
    standalone = true;
    stubServiceWorker();
    await mountInstalled();
    const scroller = document.createElement('div');
    const row = document.createElement('div');
    scroller.append(row);
    document.body.append(scroller);
    scroller.scrollTop = 20;

    pullAndRelease(row, 200);

    expect(stubbedRegistration.update).not.toHaveBeenCalled();
    scroller.remove();
  });

  it('leaves horizontal swipes to the page', async () => {
    standalone = true;
    stubServiceWorker();
    const chip = await mountInstalled();

    pullTo(shell(), 5, 80);
    release(shell(), 5, 80);

    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'idle'));
    expect(chip.style.getPropertyValue('--pull')).toBe('');
    expect(stubbedRegistration.update).not.toHaveBeenCalled();
  });

  it('leaves upward scrolls to the page', async () => {
    standalone = true;
    stubServiceWorker();
    const chip = await mountInstalled();

    pullTo(shell(), -40);
    release(shell(), -40);

    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'idle'));
    expect(stubbedRegistration.update).not.toHaveBeenCalled();
  });
});
