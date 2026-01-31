import type { RenderOptions } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

type NuqsRenderOptions = RenderOptions & {
  nuqsOptions?: Omit<ComponentProps<typeof NuqsTestingAdapter>, 'children'>;
  routerOptions?: Omit<ComponentProps<typeof MemoryRouterProvider>, 'children'>;
};

/**
 * Combined setup with userEvent mocks for Next.js.
 * Returns user instance + all render utilities.
 * Follows testing-library recommended pattern: https://testing-library.com/docs/user-event/intro/
 */
export function setupApp(
  ui: ReactNode,
  { nuqsOptions, routerOptions, ...renderOptions }: NuqsRenderOptions = {},
) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouterProvider {...routerOptions}>
        <NuqsTestingAdapter {...nuqsOptions}>{ui}</NuqsTestingAdapter>
      </MemoryRouterProvider>,
      renderOptions,
    ),
  };
}
