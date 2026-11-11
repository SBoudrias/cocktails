import '@testing-library/jest-dom/vitest';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Storage } from 'happy-dom';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ComponentProps, ReactNode } from 'react';
import { createElement } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { beforeEach, vi } from 'vitest';

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

export function setupApp(
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

  return {
    get user() {
      user ??= userEvent.setup();
      return user;
    },
    ...render(
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
    ),
  };
}
