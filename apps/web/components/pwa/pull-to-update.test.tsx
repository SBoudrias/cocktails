import { screen, waitFor } from '@testing-library/react';
import { toast } from '@ui-sdk/react/toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import AppToasts from './AppToasts';
import PullToUpdate from './PullToUpdate';

/**
 * The pull-to-update gesture, driven as real touch sequences on the
 * window. happy-dom carries no layout, so the rubber-banded distance is
 * computed by the same formula the component uses against
 * window.innerHeight (768 in this environment): a 200px drag shows ~96px
 * (past the 56px threshold), a 30px one ~16px (under it).
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

/** Stubs the service worker layer the check talks to. */
function stubServiceWorker({
  waiting,
  installing,
  controlled = true,
}: {
  waiting?: ServiceWorker;
  installing?: ServiceWorker;
  controlled?: boolean;
} = {}) {
  stubbedRegistration.update.mockResolvedValue(undefined);
  const registration = {
    update: stubbedRegistration.update,
    waiting: waiting ?? null,
    installing: installing ?? null,
    // The check reads only these three fields.
  } as unknown as ServiceWorkerRegistration;
  const controller = controlled ? ({} as ServiceWorker) : undefined;
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(registration), controller },
    configurable: true,
  });
}

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

  it('checks for an update on release past the threshold', async () => {
    standalone = true;
    stubServiceWorker();
    const chip = await mountInstalled();

    pullTo(shell(), 200);
    await waitFor(() => expect(chip).toHaveAttribute('data-armed'));

    release(shell(), 200);
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'checking'));
    await waitFor(() => expect(chip).toHaveTextContent('Up to date'));
    expect(chip).toHaveAttribute('data-phase', 'fresh');
    expect(stubbedRegistration.update).toHaveBeenCalledTimes(1);
  });

  it('offers the update toast when a worker is already waiting', async () => {
    standalone = true;
    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    stubServiceWorker({ waiting });
    await setupApp(
      <>
        <PullToUpdate />
        <AppToasts />
      </>,
    );
    const chip = await waitFor(() => {
      const mounted = document.querySelector<HTMLElement>('[data-slot="ptr-chip"]');
      if (mounted == null) throw new Error('chip did not mount');
      return mounted;
    });

    pullAndRelease(shell(), 200);

    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/a new version is available/i);
    // The chip steps aside for the toast.
    await waitFor(() => expect(chip).toHaveAttribute('data-phase', 'settle'));
  });

  it('says the app is up to date when the update found nothing', async () => {
    standalone = true;
    stubServiceWorker();
    const chip = await mountInstalled();

    pullAndRelease(shell(), 200);

    await waitFor(() => expect(chip).toHaveTextContent('Up to date'));
    // No toast: nothing needs action.
    expect(
      screen.queryByRole('region', { name: 'Notifications' }),
    ).not.toBeInTheDocument();
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
    document.body.appendChild(sheet);

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
    scroller.appendChild(row);
    document.body.appendChild(scroller);
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
