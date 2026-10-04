import { screen } from '@testing-library/react';
import { setupApp } from '#/vitest.setup';
import SearchShortcut from './index';

function SearchPage() {
  return (
    <>
      <SearchShortcut />
      <input type="search" aria-label="search" />
    </>
  );
}

describe('SearchShortcut', () => {
  it('focuses the search input when "/" is pressed', async () => {
    const { user } = setupApp(<SearchPage />);

    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveFocus();

    await user.keyboard('/');

    expect(input).toHaveFocus();
  });

  it('does not steal focus when typing "/" inside the search input', async () => {
    const { user } = setupApp(<SearchPage />);

    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.type(input, '/');

    expect(input).toHaveFocus();
    expect(input).toHaveValue('/');
  });
});
