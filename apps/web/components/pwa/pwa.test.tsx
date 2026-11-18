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

describe('the PWA toasts', () => {
  afterEach(() => {
    // The shared toast() queue is module-global: clear it between tests,
    // or one test's toasts leak into the next mount's region.
    toast.dismiss();
    sessionStorage.clear();
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
});
