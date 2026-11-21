import { screen, waitFor } from '@testing-library/react';
import { toast } from '@ui-sdk/react/toast';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import AppToasts from './AppToasts';
import PwaStatus from './PwaStatus';

/** The non-standard event Chrome fires when the app is installable. */
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const fireInstallPrompt = () => {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  window.dispatchEvent(event);
  return event;
};

/** The toast region with whatever PwaStatus fired. */
async function mountPwa() {
  const view = await setupApp(
    <>
      <PwaStatus />
      <AppToasts />
    </>,
  );
  return view;
}

/** A worker already waiting at launch, as a visit right after a real deploy
 * sees it: PwaStatus offers the update toast as soon as its ready promise
 * resolves (the same shape pull-to-update.test stubs). */
function stubWaitingWorker() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {} as ServiceWorker,
      ready: Promise.resolve({
        waiting: { postMessage: vi.fn() },
        installing: null,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    },
  });
}

/** The live-deploy machinery: a registration whose updatefound fires, an
 * installing worker that then lands 'installed' — the updatefound →
 * statechange → waiting path PwaStatus wires, driven by hand. Returns the
 * trigger; PwaStatus has registered its listeners by the time a toast has
 * rendered. */
function stubDeployArriving() {
  const statechange: Array<() => void> = [];
  const updatefound: Array<() => void> = [];
  const worker = {
    state: 'installing',
    postMessage: vi.fn(),
    addEventListener: (_: string, listener: () => void) => statechange.push(listener),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {} as ServiceWorker,
      ready: Promise.resolve({
        installing: worker,
        waiting: null,
        addEventListener: (_: string, listener: () => void) => updatefound.push(listener),
        removeEventListener: () => {},
      }),
    },
  });
  return () => {
    for (const listener of updatefound) listener();
    worker.state = 'installed';
    for (const listener of statechange) listener();
  };
}

describe('the PWA toasts', () => {
  afterEach(() => {
    // The shared toast() queue is module-global: clear it between tests,
    // or one test's toasts leak into the next mount's region.
    toast.dismiss();
    sessionStorage.clear();
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('offers the native install when the browser fires beforeinstallprompt', async () => {
    await mountPwa();
    fireInstallPrompt();

    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/install indexotica\?/i);
    expect(region).toHaveTextContent(/on this device, works offline\./i);
    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument();
  });

  it('replaces, not stacks, when Chrome re-fires beforeinstallprompt', async () => {
    await mountPwa();
    fireInstallPrompt();
    await screen.findByRole('region', { name: 'Notifications' });

    // Chrome re-fires the event (e.g. after a prevented prompt); the hint
    // must dedupe to one toast, not stack a second.
    fireInstallPrompt();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const titles = screen.getAllByText(/install indexotica\?/i);
    expect(titles).toHaveLength(1);
  });

  it('calls the captured prompt when Install is chosen', async () => {
    const { user } = await mountPwa();
    const event = fireInstallPrompt();
    await screen.findByRole('region', { name: 'Notifications' });

    expect(event.prompt).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
  });

  it('stays dismissed for the session after Not now', async () => {
    const { user } = await mountPwa();
    fireInstallPrompt();
    await screen.findByRole('region', { name: 'Notifications' });

    await user.click(screen.getByRole('button', { name: /not now/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Notifications' }),
      ).not.toBeInTheDocument(),
    );

    // The browser may re-fire the event later in the session; a dismissed
    // user stays dismissed until the next session.
    fireInstallPrompt();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      screen.queryByRole('region', { name: 'Notifications' }),
    ).not.toBeInTheDocument();
  });

  it('announces the offline state when the browser goes offline', async () => {
    await mountPwa();
    window.dispatchEvent(new Event('offline'));

    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/you are offline/i);
    // Dismissible before the connection returns: someone who got the
    // point can clear it early.
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('clears the offline note by hand when Dismiss is chosen', async () => {
    const { user } = await mountPwa();
    window.dispatchEvent(new Event('offline'));
    await screen.findByRole('region', { name: 'Notifications' });

    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Notifications' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('clears the offline note when back online', async () => {
    await mountPwa();
    window.dispatchEvent(new Event('offline'));
    await screen.findByRole('region', { name: 'Notifications' });

    window.dispatchEvent(new Event('online'));
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Notifications' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('offers the update when a worker is already waiting at launch', async () => {
    stubWaitingWorker();
    await mountPwa();

    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/a new version is available/i);
    expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument();
  });

  it('never shows the install hint while the update toast is up (update first)', async () => {
    stubWaitingWorker();
    await mountPwa();
    await screen.findByRole('region', { name: 'Notifications' });

    // The launch race, one direction: a fresh deploy's worker waits while
    // Chrome fires beforeinstallprompt on the same visit. The update is
    // about correctness; the hint waits for a stage of its own.
    fireInstallPrompt();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/a new version is available/i);
    expect(region).not.toHaveTextContent(/install indexotica\?/i);
  });

  it('dismisses the standing install hint when the update toast arrives (install first)', async () => {
    const arriveDeploy = stubDeployArriving();
    await mountPwa();

    fireInstallPrompt();
    await screen.findByRole('region', { name: 'Notifications' });

    // The other direction: the hint lands, then the update is detected
    // mid-session (updatefound after a pull-to-update check, or the
    // launch race resolving late). The update takes the stage.
    arriveDeploy();
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/a new version is available/i);
    expect(region).not.toHaveTextContent(/install indexotica\?/i);
  });

  it('lets the install hint return once the update toast is gone', async () => {
    stubWaitingWorker();
    await mountPwa();
    await screen.findByRole('region', { name: 'Notifications' });

    // The update toast times out; Chrome re-fires beforeinstallprompt (as
    // it does after a prevented prompt). The hint gets its turn now —
    // the deferral never becomes a session-long suppression.
    toast.dismiss();
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Notifications' }),
      ).not.toBeInTheDocument(),
    );

    fireInstallPrompt();
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/install indexotica\?/i);
    expect(region).not.toHaveTextContent(/a new version is available/i);
  });

  it('lets the offline note share the stack with the update toast', async () => {
    stubWaitingWorker();
    await mountPwa();
    await screen.findByRole('region', { name: 'Notifications' });

    // The offline note is environmental state, not an offer competing for
    // the same decision — both stay, each alone meaningful.
    window.dispatchEvent(new Event('offline'));
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(region).toHaveTextContent(/a new version is available/i);
    expect(region).toHaveTextContent(/you are offline/i);
  });
});
