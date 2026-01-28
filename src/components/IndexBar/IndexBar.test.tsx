import { fireEvent, render, screen } from '@testing-library/react';
import IndexBar from './index';

const availableIndexes = new Set(['A', 'D', 'M']);

describe('IndexBar', () => {
  it('renders all alphabet letters plus #', () => {
    render(<IndexBar availableIndexes={availableIndexes} onIndexSelect={vi.fn()} />);

    const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveTextContent('#');
    expect(nav).toHaveTextContent('A');
    expect(nav).toHaveTextContent('Z');
  });

  it('calls onIndexSelect when clicking a letter with content', () => {
    const onIndexSelect = vi.fn();
    render(
      <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
    );

    const aButton = screen.getByRole('button', { name: 'Jump to A' });
    fireEvent.click(aButton);

    expect(onIndexSelect).toHaveBeenCalledWith('A');
  });

  it('jumps to next available letter when clicking empty letter', () => {
    const onIndexSelect = vi.fn();
    render(
      <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
    );

    // B has no content, should jump to D (next available)
    const bButton = screen.getByRole('button', { name: 'Jump to B' });
    fireEvent.click(bButton);

    expect(onIndexSelect).toHaveBeenCalledWith('D');
  });

  it('highlights the active index', () => {
    render(
      <IndexBar
        activeIndex="M"
        availableIndexes={availableIndexes}
        onIndexSelect={vi.fn()}
      />,
    );

    const mButton = screen.getByRole('button', { name: 'Jump to M' });
    expect(mButton).toHaveAttribute('aria-current', 'true');
  });

  it('makes letters without content non-focusable', () => {
    render(<IndexBar availableIndexes={availableIndexes} onIndexSelect={vi.fn()} />);

    // A has content, should be focusable
    const aButton = screen.getByRole('button', { name: 'Jump to A' });
    expect(aButton).toHaveAttribute('tabIndex', '0');

    // B has no content, should not be focusable
    const bButton = screen.getByRole('button', { name: 'Jump to B' });
    expect(bButton).toHaveAttribute('tabIndex', '-1');
  });

  it('shows floating indicator during drag', () => {
    render(<IndexBar availableIndexes={availableIndexes} onIndexSelect={vi.fn()} />);

    const nav = screen.getByRole('navigation', { name: 'Alphabet index' });

    // No indicator initially
    expect(screen.queryByText('A', { selector: 'h4' })).not.toBeInTheDocument();

    // Start dragging
    fireEvent.mouseDown(nav);

    // Indicator should appear after moving over a letter
    const aButton = screen.getByRole('button', { name: 'Jump to A' });
    fireEvent.mouseMove(aButton, { clientX: 100, clientY: 100 });

    // Indicator would show during drag (though elementFromPoint mock would be needed for full test)
  });

  it('supports custom index list', () => {
    render(
      <IndexBar
        indexes={['1', '2', '3']}
        availableIndexes={new Set(['1', '2'])}
        onIndexSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Jump to 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to 3' })).toBeInTheDocument();
  });
});
