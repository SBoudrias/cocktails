import { fireEvent, render, screen } from '@testing-library/react';
import IndexBar from './index';

const ALPHABET = [
  '#',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];
const availableIndexes = new Set(['A', 'D', 'M']);

// The drag maps the pointer onto the rail's rect: give each letter 10px of a
// rail starting at the top of the viewport
const LETTER_HEIGHT = 10;
const letterY = (index: string) =>
  ALPHABET.indexOf(index) * LETTER_HEIGHT + LETTER_HEIGHT / 2;

function mockRailRect() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width: 20, height: ALPHABET.length * LETTER_HEIGHT }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('IndexBar', () => {
  it('renders all alphabet letters plus #', () => {
    render(
      <IndexBar
        indexes={ALPHABET}
        availableIndexes={availableIndexes}
        onIndexSelect={vi.fn()}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
    expect(nav).toHaveTextContent('#');
    expect(nav).toHaveTextContent('A');
    expect(nav).toHaveTextContent('Z');
  });

  describe('keyboard activation', () => {
    it('selects a letter with content and asks for focus to follow', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      // A click without a pointer behind it (detail 0) is a keyboard activation
      fireEvent.click(screen.getByRole('button', { name: 'Jump to A' }), { detail: 0 });

      expect(onIndexSelect).toHaveBeenLastCalledWith('A', { focus: true });
    });

    it('jumps to the next available letter from an empty one', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Jump to B' }), { detail: 0 });

      expect(onIndexSelect).toHaveBeenLastCalledWith('D', { focus: true });
    });

    it('falls back to the previous available letter after the last one', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Jump to Z' }), { detail: 0 });

      expect(onIndexSelect).toHaveBeenLastCalledWith('M', { focus: true });
    });

    it('ignores the click that follows a pointer tap', () => {
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      // The pointer handlers already activated; a pointer click has detail >= 1
      fireEvent.click(screen.getByRole('button', { name: 'Jump to A' }), { detail: 1 });

      expect(onIndexSelect).not.toHaveBeenCalled();
    });
  });

  it('highlights the active index', () => {
    render(
      <IndexBar
        indexes={ALPHABET}
        activeIndex="M"
        availableIndexes={availableIndexes}
        onIndexSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Jump to M' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  describe('roving focus', () => {
    it('has a single tab stop on the active letter', () => {
      render(
        <IndexBar
          indexes={ALPHABET}
          activeIndex="M"
          availableIndexes={availableIndexes}
          onIndexSelect={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Jump to M' })).toHaveAttribute(
        'tabIndex',
        '0',
      );
      expect(screen.getByRole('button', { name: 'Jump to A' })).toHaveAttribute(
        'tabIndex',
        '-1',
      );
    });

    it('falls back to the first letter with content without an active one', () => {
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Jump to A' })).toHaveAttribute(
        'tabIndex',
        '0',
      );
      expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveAttribute(
        'tabIndex',
        '-1',
      );
    });

    it('moves focus between letters with content using the arrow keys', () => {
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={vi.fn()}
        />,
      );

      const aButton = screen.getByRole('button', { name: 'Jump to A' });
      aButton.focus();

      fireEvent.keyDown(aButton, { key: 'ArrowDown' });
      expect(screen.getByRole('button', { name: 'Jump to D' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement ?? aButton, { key: 'End' });
      expect(screen.getByRole('button', { name: 'Jump to M' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement ?? aButton, { key: 'ArrowDown' });
      expect(screen.getByRole('button', { name: 'Jump to M' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement ?? aButton, { key: 'Home' });
      expect(aButton).toHaveFocus();
    });
  });

  describe('drag', () => {
    it('scrubs through letters, scrolling only when the target changes', () => {
      mockRailRect();
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });
      const status = screen.getByRole('status');

      fireEvent.pointerDown(nav, { pointerId: 1, button: 0, clientY: letterY('A') });
      expect(onIndexSelect).toHaveBeenLastCalledWith('A', { focus: false });
      expect(status).toHaveTextContent('A');

      fireEvent.pointerMove(nav, { pointerId: 1, clientY: letterY('M') });
      expect(onIndexSelect).toHaveBeenLastCalledWith('M', { focus: false });
      expect(status).toHaveTextContent('M');

      // Still on M, then on N (empty, resolves to M): no new scroll
      fireEvent.pointerMove(nav, { pointerId: 1, clientY: letterY('M') + 1 });
      fireEvent.pointerMove(nav, { pointerId: 1, clientY: letterY('N') });
      expect(onIndexSelect).toHaveBeenCalledTimes(['A', 'M'].length);
      expect(status).toHaveTextContent('N');
    });

    it('clamps to the first and last letters past the ends of the rail', () => {
      mockRailRect();
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });

      fireEvent.pointerDown(nav, { pointerId: 1, button: 0, clientY: letterY('D') });
      fireEvent.pointerMove(nav, { pointerId: 1, clientY: -100 });
      expect(screen.getByRole('status')).toHaveTextContent('#');
      expect(onIndexSelect).toHaveBeenLastCalledWith('A', { focus: false });

      fireEvent.pointerMove(nav, { pointerId: 1, clientY: 10_000 });
      expect(screen.getByRole('status')).toHaveTextContent('Z');
      expect(onIndexSelect).toHaveBeenLastCalledWith('M', { focus: false });
    });

    it('ends the drag when the pointer capture is lost', () => {
      mockRailRect();
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });

      fireEvent.pointerDown(nav, { pointerId: 1, button: 0, clientY: letterY('A') });
      expect(screen.getByRole('status')).toHaveTextContent('A');

      // The browser fires lostpointercapture however the drag ends
      fireEvent.lostPointerCapture(nav, { pointerId: 1 });
      expect(screen.getByRole('status')).toBeEmptyDOMElement();

      // Moves after the drag no longer scrub
      fireEvent.pointerMove(nav, { pointerId: 1, clientY: letterY('M') });
      expect(onIndexSelect).toHaveBeenCalledTimes(1);
    });

    it('does not start a drag from a hover or a right click', () => {
      mockRailRect();
      const onIndexSelect = vi.fn();
      render(
        <IndexBar
          indexes={ALPHABET}
          availableIndexes={availableIndexes}
          onIndexSelect={onIndexSelect}
        />,
      );

      const nav = screen.getByRole('navigation', { name: 'Alphabet index' });

      fireEvent.pointerMove(nav, { pointerId: 1, clientY: letterY('M') });
      fireEvent.pointerDown(nav, { pointerId: 1, button: 2, clientY: letterY('A') });

      expect(onIndexSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });

  it('labels a custom index list and announces the label while dragging', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 20, height: 3 * LETTER_HEIGHT }),
    );
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
    expect(screen.getByRole('button', { name: 'Jump to Rum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to Tiki' })).toBeInTheDocument();

    fireEvent.pointerDown(nav, { pointerId: 1, button: 0, clientY: LETTER_HEIGHT * 1.5 });
    expect(screen.getByRole('status')).toHaveTextContent('Tiki');
  });
});
