import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ComponentProps, ReactNode } from 'react';

type NuqsRenderOptions = RenderOptions & {
  nuqsOptions?: Omit<ComponentProps<typeof NuqsTestingAdapter>, 'children'>;
};

/**
 * Render with NuqsTestingAdapter wrapper for URL state testing.
 * Pass nuqsOptions.searchParams or nuqsOptions.onUrlUpdate for URL state control.
 */
export function renderWithNuqs(
  ui: ReactNode,
  { nuqsOptions, ...renderOptions }: NuqsRenderOptions = {},
) {
  return render(
    <NuqsTestingAdapter {...nuqsOptions}>{ui}</NuqsTestingAdapter>,
    renderOptions,
  );
}

/**
 * Combined setup with userEvent and NuqsTestingAdapter.
 * Returns user instance + all render utilities.
 * Follows testing-library recommended pattern: https://testing-library.com/docs/user-event/intro/
 */
export function setupWithNuqs(ui: ReactNode, options: NuqsRenderOptions = {}) {
  return {
    user: userEvent.setup(),
    ...renderWithNuqs(ui, options),
  };
}
