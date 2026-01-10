import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from './index';

describe('SearchInput', () => {
  it('renders with placeholder text', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Search recipes…" />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Search recipes…');
  });

  it('renders with default placeholder when not specified', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Search…');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'margarita');

    expect(onChange).toHaveBeenCalledTimes(9);
    expect(onChange).toHaveBeenLastCalledWith('a');
  });

  it('clears value and calls onChange with null when clear button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="daiquiri" onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('focuses input after clearing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="daiquiri" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveFocus();
  });

  it('auto-focuses when autoFocus prop is true', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} autoFocus />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();
  });

  it('does not auto-focus when autoFocus prop is false', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} autoFocus={false} />);

    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveFocus();
  });

  it('blurs input when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="test" onChange={onChange} autoFocus />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(input).not.toHaveFocus();
  });

  it('displays the provided value', () => {
    const onChange = vi.fn();
    render(<SearchInput value="mojito" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('mojito');
  });

  it('has proper accessibility attributes', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'search');
    expect(input).toHaveAttribute('type', 'search');
  });
});
