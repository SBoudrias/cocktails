import '@testing-library/jest-dom/vitest';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Storage } from 'happy-dom';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ComponentProps, ReactNode } from 'react';
import { createElement } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { beforeEach, expect, vi } from 'vitest';
import { getPendingSharedJsonLoads } from '#/modules/sharedJson';

vi.mock('next/router', async () => import('next-router-mock'));
vi.mock('next/navigation', async () => import('next-router-mock/navigation'));
vi.mock('lite-youtube-embed', () => ({}));

// The mock router is a singleton: start every test from a clean URL, so a
// query set by one test (mockRouter.setCurrentUrl) never leaks into the next.
beforeEach(() => {
  mockRouter.setCurrentUrl('/');
});

// In Node.js 25+, the global localStorage is a built-in that lacks the full
// Web Storage API (e.g. no clear()). Replace it with happy-dom's implementation.
if (typeof localStorage?.clear !== 'function') {
  vi.stubGlobal('localStorage', new Storage());
}

/**
 * Flush the shared-JSON loads the mounted page started, so tests assert on
 * complete lists without waiting per call site. Resolves once no load is
 * pending AND no [data-loading] element is left in the DOM — a fetch can
 * settle before React commits its result, and the DOM is the visible truth.
 *
 * RTL's waitFor does the polling, under a short cap: loads settle in-process
 * (msw, local React commits) or never — a deliberately hung load, a test
 * asserting the loading state — which the cap lets outlast the flush without
 * paying the full 1s default per such test. The catch moves on with the
 * loader still on screen rather than failing the test here.
 */
const flushPoll = { timeout: 350, interval: 50 } as const;

async function flushSharedJsonLoads(): Promise<void> {
  const nothingPending = () => getPendingSharedJsonLoads().length === 0;
  const nothingLoading = () => !document.querySelector('[data-loading]');

  await waitFor(() => {
    expect(nothingPending()).toBe(true);
    expect(nothingLoading()).toBe(true);
  }, flushPoll).catch(() => {});
}

/**
 * happy-dom lays nothing out, so virtualized lists (react-virtuoso) would
 * measure a zero-height viewport and render no rows. Give them a viewport tall
 * enough to render every row of a test's data.
 */
export function withVirtuosoViewport(ui: ReactNode) {
  return createElement(VirtuosoMockContext.Provider, {
    value: { viewportHeight: 100_000, itemHeight: 50 },
    children: ui,
  });
}

export async function setupApp(
  ui: ReactNode,
  {
    nuqsOptions,
    routerOptions,
    ...renderOptions
  }: RenderOptions & {
    nuqsOptions?: Omit<ComponentProps<typeof NuqsTestingAdapter>, 'children'>;
    routerOptions?: Omit<ComponentProps<typeof MemoryRouterProvider>, 'children'>;
  } = {},
) {
  let user: ReturnType<typeof userEvent.setup> | undefined;

  const rendered = render(
    createElement(MemoryRouterProvider, {
      ...routerOptions,
      children: createElement(NuqsTestingAdapter, {
        // In the app, nuqs and Next's router read the same URL: start nuqs
        // from the query the test set with mockRouter.setCurrentUrl.
        searchParams: new URL(mockRouter.asPath, 'http://localhost').search,
        ...nuqsOptions,
        children: withVirtuosoViewport(ui),
      }),
    }),
    renderOptions,
  );

  // Pages load their shared JSON (catalog, search index) right after mount;
  // flush those loads before handing the page back, so tests assert on
  // complete lists without waitFor at each call site: as soon as no loading
  // state is left in the DOM (happy path: immediately after the loads
  // settle), on to a short bounded poll for slower environments. A fetch
  // that never settles (a test asserting the loading state) is cut off by
  // the attempt cap, not by a fixed sleep every test pays.
  await flushSharedJsonLoads();

  return {
    get user() {
      user ??= userEvent.setup();
      return user;
    },
    ...rendered,
  };
}
