import { fireEvent, screen } from '@testing-library/react';
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
  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { shiftKey: true },
    { isComposing: true },
  ])('ignores modified or composing events: %j', (options) => {
    setupApp(<SearchPage />);
    fireEvent.keyDown(document, { key: '/', ...options });
    expect(screen.getByRole('searchbox', { name: 'search' })).not.toHaveFocus();
  });

  it('ignores events already handled elsewhere', () => {
    setupApp(<SearchPage />);
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    event.preventDefault();
    fireEvent(document, event);
    expect(screen.getByRole('searchbox', { name: 'search' })).not.toHaveFocus();
  });

  it('prefers the page filter over the global launcher', async () => {
    const { user } = setupApp(
      <>
        <SearchShortcut />
        <nav aria-label="Site sections">
          <input type="search" aria-label="Search all recipes" />
        </nav>
        <main>
          <input type="search" aria-label="Filter this page" />
        </main>
      </>,
    );
    const input = screen.getByRole('searchbox', { name: 'Filter this page' });
    const focus = vi.spyOn(input, 'focus');
    await user.keyboard('/');
    expect(input).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('does not steal focus from contenteditable text', () => {
    setupApp(
      <>
        <SearchPage />
        <div contentEditable aria-label="Notes" role="textbox" />
      </>,
    );
    const notes = screen.getByRole('textbox', { name: 'Notes' });
    notes.focus();
    fireEvent.keyDown(notes, { key: '/' });
    expect(notes).toHaveFocus();
  });

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
