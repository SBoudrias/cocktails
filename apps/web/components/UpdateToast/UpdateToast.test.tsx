import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import UpdateToast from './index';

/** A waiting worker for a new deploy, with just the surface the toast uses. */
const fakeWorker = () =>
  ({ postMessage: vi.fn() }) as unknown as ServiceWorker & {
    postMessage: ReturnType<typeof vi.fn>;
  };

const stubServiceWorker = (registration: Record<string, unknown>) => {
  // happy-dom has no service worker implementation: hand the component a
  // minimal one. A promise that never resolves for `ready` would hang the
  // test, so it resolves immediately with the given registration.
  vi.stubGlobal('navigator', {
    ...navigator,
    onLine: true,
    serviceWorker: {
      controller: {},
      ready: Promise.resolve({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        ...registration,
      }),
    },
  });
};

describe('UpdateToast', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers an update when a new service worker is already waiting', async () => {
    const worker = fakeWorker();
    stubServiceWorker({ waiting: worker });

    await setupApp(<UpdateToast />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/new version is available/i);
  });

  it('shows nothing when there is no update', async () => {
    stubServiceWorker({ waiting: null });

    await setupApp(<UpdateToast />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('skips the waiting worker and reloads when Update is chosen', async () => {
    const worker = fakeWorker();
    stubServiceWorker({ waiting: worker });
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      configurable: true,
    });

    const { user } = await setupApp(<UpdateToast />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
