import { describe, expect, it } from 'vitest';

/**
 * The guarantee the shared msw setup makes (see ./mswSetup.ts): any fetch to
 * an endpoint no test mocked rejects, never falls through to the network or a
 * stubbed global fetch. This canary holds that line.
 */
describe('msw setup', () => {
  it('rejects a fetch to an endpoint no test mocked', async () => {
    await expect(
      fetch(new URL('/cocktails/data/unmocked.json', location.origin).href),
    ).rejects.toThrow();
  });
});
