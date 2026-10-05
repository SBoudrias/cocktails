import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('jumps backward to the last available letter when clicking Z-like trailing empty letters', () => {
    const onIndexSelect = vi.fn();
    render(
      <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
    );

    // T, U, ... Z have no content and nothing follows them: the search
    // falls back to the nearest available index backwards (M)
    const zButton = screen.getByRole('button', { name: 'Jump to Z' });
    fireEvent.click(zButton);

    expect(onIndexSelect).toHaveBeenCalledWith('M');
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

  describe('drag', () => {
    it('activates indexes during a pointer drag and shows the indicator tracking the pointer', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
      const aButton = screen.getByRole('button', { name: 'Jump to A' });
      const mButton = screen.getByRole('button', { name: 'Jump to M' });

      // Hit-test through elementFromPoint like a real drag
      const fromPoint = vi.spyOn(document, 'elementFromPoint').mockReturnValue(aButton);

      fireEvent.pointerDown(nav, { pointerId: 1, clientX: 100, clientY: 100 });
      expect(onIndexSelect).toHaveBeenCalledWith('A');

      // Indicator appears and follows the pointer's Y position
      expect(screen.getByRole('status')).toHaveTextContent('A');

      fromPoint.mockReturnValue(mButton);
      fireEvent.pointerMove(nav, { pointerId: 1, clientX: 100, clientY: 300 });

      expect(onIndexSelect).toHaveBeenCalledWith('M');
      expect(screen.getByRole('status')).toHaveTextContent('M');

      // Drag ends on release: indicator disappears, capture released
      fireEvent.pointerUp(nav, { pointerId: 1, clientX: 100, clientY: 300 });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(nav.hasPointerCapture(1)).toBe(false);

      fromPoint.mockRestore();
    });

    it('ends the drag even when the pointer is released outside the bar (pointer capture)', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
      const aButton = screen.getByRole('button', { name: 'Jump to A' });

      const fromPoint = vi.spyOn(document, 'elementFromPoint').mockReturnValue(aButton);

      fireEvent.pointerDown(nav, { pointerId: 1, clientX: 100, clientY: 100 });
      expect(nav.hasPointerCapture(1)).toBe(true);

      // Pointer captured: moves outside the bar still track
      fromPoint.mockReturnValue(null);
      fireEvent.pointerMove(nav, { pointerId: 1, clientX: 500, clientY: 500 });
      expect(onIndexSelect).toHaveBeenCalledTimes(1);

      // Release outside the bar still ends the drag
      fireEvent.pointerUp(nav, { pointerId: 1, clientX: 500, clientY: 500 });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(nav.hasPointerCapture(1)).toBe(false);

      fromPoint.mockRestore();
    });

    it('does not double-activate from the click following a pointer activation', async () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar availableIndexes={availableIndexes} onIndexSelect={onIndexSelect} />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
      const aButton = screen.getByRole('button', { name: 'Jump to A' });

      const fromPoint = vi.spyOn(document, 'elementFromPoint').mockReturnValue(aButton);

      // Full pointer sequence, then the synthetic click a browser fires
      // after a touch/pointer tap
      fireEvent.pointerDown(nav, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerUp(nav, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.click(aButton);

      expect(onIndexSelect).toHaveBeenCalledTimes(1);

      fromPoint.mockRestore();

      // The suppression re-arms so a later real click still works
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Jump to D' }));
        expect(onIndexSelect).toHaveBeenCalledWith('D');
      });
    });
  });

  it('supports a custom index list with labels', () => {
    render(
      <IndexBar
        indexes={['01', '02', '03']}
        availableIndexes={new Set(['01', '02'])}
        onIndexSelect={vi.fn()}
        indexInfo={(index) => ({ '01': 'Rum', '02': 'Tiki' })[index]}
        ariaLabel="Chapter index"
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Chapter index' });
    expect(nav).toHaveTextContent('01');
    expect(nav).toHaveTextContent('02');

    // Chapter name in the aria-label, number in the bubble text
    expect(screen.getByRole('button', { name: 'Jump to Rum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to Tiki' })).toBeInTheDocument();
  });
});
