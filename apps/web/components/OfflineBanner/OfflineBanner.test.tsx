import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import OfflineBanner from './index';

describe('OfflineBanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('shows nothing while online', async () => {
    await setupApp(<OfflineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces the offline state when the browser goes offline', async () => {
    // happy-dom's navigator.onLine is always true; the banner reads the
    // property on the event, so stub the transition itself.
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    await setupApp(<OfflineBanner />);
    window.dispatchEvent(new Event('offline'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/you are offline/i);
  });

  it('clears itself when back online', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    await setupApp(<OfflineBanner />);
    window.dispatchEvent(new Event('offline'));
    await screen.findByRole('alert');

    vi.stubGlobal('navigator', { ...navigator, onLine: true });
    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
