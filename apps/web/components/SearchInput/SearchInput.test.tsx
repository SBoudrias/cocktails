import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from './index';

describe('SearchInput', () => {
  it('renders with placeholder text', () => {
    const onChangeAction = vi.fn();
    render(
      <SearchInput
        value=""
        onChangeAction={onChangeAction}
        placeholder="Search recipes…"
      />,
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Search recipes…');
  });

  it('renders with default placeholder when not specified', () => {
    const onChangeAction = vi.fn();
    render(<SearchInput value="" onChangeAction={onChangeAction} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Search…');
  });

  it('calls onChangeAction when user types', async () => {
    const user = userEvent.setup();
    const onChangeAction = vi.fn();
    render(<SearchInput value="" onChangeAction={onChangeAction} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'margarita');

    expect(onChangeAction).toHaveBeenCalledTimes('margarita'.length);
    expect(onChangeAction).toHaveBeenLastCalledWith('a');
  });

  it('clears value and calls onChangeAction with null when clear button clicked', async () => {
    const user = userEvent.setup();
    const onChangeAction = vi.fn();
    render(<SearchInput value="daiquiri" onChangeAction={onChangeAction} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(onChangeAction).toHaveBeenCalledWith(null);
  });

  it('focuses input after clearing', async () => {
    const user = userEvent.setup();
    const onChangeAction = vi.fn();
    render(<SearchInput value="daiquiri" onChangeAction={onChangeAction} />);

    const input = screen.getByRole('searchbox');
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveFocus();
  });

  it('auto-focuses when autoFocus prop is true', () => {
    const onChangeAction = vi.fn();
    render(<SearchInput value="" onChangeAction={onChangeAction} autoFocus />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();
  });

  it('does not auto-focus when autoFocus prop is false', () => {
    const onChangeAction = vi.fn();
    render(<SearchInput value="" onChangeAction={onChangeAction} autoFocus={false} />);

    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveFocus();
  });

  it('blurs input when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onChangeAction = vi.fn();
    render(<SearchInput value="test" onChangeAction={onChangeAction} autoFocus />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(input).not.toHaveFocus();
  });

  it('displays the provided value', () => {
    const onChangeAction = vi.fn();
    render(<SearchInput value="mojito" onChangeAction={onChangeAction} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('mojito');
  });

  it('has proper accessibility attributes', () => {
    const onChangeAction = vi.fn();
    render(<SearchInput value="" onChangeAction={onChangeAction} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'search');
    expect(input).toHaveAttribute('type', 'search');
  });
});
