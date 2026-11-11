import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetSharedJson } from '#/modules/sharedJson';
import { sharedJsonServer } from './sharedJsonServer';

/**
 * The msw lifecycle every test file shares, wired into both vitest projects
 * through setupFiles (vitest.config.mts). `onUnhandledFrame: 'error'` makes
 * any fetch without a handler reject — no test ever reaches the network or a
 * stubbed global fetch, and a test that forgets its handler fails loudly.
 * Handlers registered in one test never leak into the next.
 *
 * Node-env tests have no `location`; the shared-JSON loaders build their URL
 * from it, so give them one to work with.
 */
if (typeof location === 'undefined') {
  vi.stubGlobal('location', { origin: 'https://cocktails.test' });
}

beforeAll(() => sharedJsonServer.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  sharedJsonServer.resetHandlers();
  resetSharedJson();
});

afterAll(() => sharedJsonServer.close());
