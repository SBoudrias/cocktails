import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import InstallHint from './index';

/** The non-standard event Chrome fires when the app is installable. */
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const fireInstallPrompt = () => {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  window.dispatchEvent(event);
  return event;
};

describe('InstallHint', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('offers the native install after the browser fires beforeinstallprompt', async () => {
    await setupApp(<InstallHint showAfterMs={0} />);
    fireInstallPrompt();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/install cocktail index/i);
  });

  it('shows nothing without a beforeinstallprompt (e.g. iOS Safari)', async () => {
    await setupApp(<InstallHint showAfterMs={0} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls the captured prompt when Install is chosen', async () => {
    const { user } = await setupApp(<InstallHint showAfterMs={0} />);
    const event = fireInstallPrompt();
    await screen.findByRole('alert');

    expect(event.prompt).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^install/i }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
  });

  it('stays dismissed for the session after Not now', async () => {
    const { user } = await setupApp(<InstallHint showAfterMs={0} />);
    fireInstallPrompt();
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /not now/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());

    // The browser may re-fire the event later in the same session; a
    // dismissed user stays dismissed until the next session.
    fireInstallPrompt();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
