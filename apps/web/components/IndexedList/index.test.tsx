import { act, fireEvent, render, screen } from '@testing-library/react';
import IndexedList from './index';

type TestItem = { id: string; name: string };

const renderItem = (item: TestItem) => (
  <li key={item.id}>
    <a href={`/${item.id}`}>{item.name}</a>
  </li>
);

const letterConfig = {
  groupBy: (item: TestItem) => item.name[0]!.toUpperCase(),
  sortItemBy: (a: TestItem, b: TestItem) => a.name.localeCompare(b.name),
  sortHeaderBy: (a: string, b: string) => a.localeCompare(b),
};

const fruits = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Avocado' },
  { id: '3', name: 'Banana' },
];

// Keyboard activation: a click without a pointer behind it
const pressLetter = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }), { detail: 0 });

function spyOnScrolls() {
  const scrolled: Array<string | undefined> = [];
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (
    this: HTMLElement,
  ) {
    scrolled.push(this.dataset.header);
  });
  return scrolled;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('IndexedList', () => {
  it('jumps from an empty letter to the nearest letter with content', () => {
    const scrolled = spyOnScrolls();
    render(<IndexedList items={fruits} renderItem={renderItem} config={letterConfig} />);

    // Nothing under C or after it: falls back to B
    pressLetter('Jump to C');

    expect(scrolled).toEqual(['B']);
  });

  it('shows chapter numbers as the bar index domain when the config provides one', () => {
    render(
      <IndexedList
        items={[
          { id: '1', name: 'Zombie' },
          { id: '2', name: 'Daiquiri' },
        ]}
        renderItem={renderItem}
        config={{
          groupBy: () => 'Rum Classics',
          sortItemBy: () => 0,
          sortHeaderBy: () => 0,
          indexes: ['01', '02'],
          groupByIndex: () => '01',
        }}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Chapter index' });
    expect(nav).toHaveTextContent('01');
    expect(nav).toHaveTextContent('02');
    // No letters in chapter mode
    expect(nav.textContent).not.toMatch(/[A-Z]/);
  });

  it('scrolls to the group and moves focus into it on a keyboard jump', () => {
    const scrolled = spyOnScrolls();
    render(<IndexedList items={fruits} renderItem={renderItem} config={letterConfig} />);

    pressLetter('Jump to B');

    expect(scrolled).toEqual(['B']);
    expect(screen.getByRole('link', { name: 'Banana' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('scrolls to the mapped chapter group when a numeric index is selected', () => {
    const scrolled = spyOnScrolls();
    render(
      <IndexedList
        items={[
          { id: '1', name: 'Zombie' },
          { id: '2', name: 'Swizzle' },
        ]}
        renderItem={renderItem}
        config={{
          groupBy: (item: TestItem) =>
            item.name === 'Zombie' ? 'The Golden Era' : 'The Birth of Tiki',
          sortItemBy: () => 0,
          sortHeaderBy: () => 0,
          indexes: ['01', '02'],
          groupByIndex: (header) => (header === 'The Birth of Tiki' ? '01' : '02'),
        }}
      />,
    );

    pressLetter('Jump to The Golden Era');

    expect(scrolled).toEqual(['The Golden Era']);
  });

  it('highlights the topmost group crossing the viewport band', () => {
    let reportIntersections:
      | ((entries: Array<{ target: Element; isIntersecting: boolean }>) => void)
      | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof reportIntersections) {
          reportIntersections = callback;
        }
        observe() {}
        disconnect() {}
      },
    );

    render(<IndexedList items={fruits} renderItem={renderItem} config={letterConfig} />);

    const groupA = screen.getByRole('group', { name: 'A' }).closest('[data-header]');
    const groupB = screen.getByRole('group', { name: 'B' }).closest('[data-header]');
    const report = (target: Element | null, isIntersecting: boolean) =>
      act(() => {
        if (target) reportIntersections?.([{ target, isIntersecting }]);
      });

    report(groupB, true);
    expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Scrolling up: A's bottom enters the band while B's top is still in it
    report(groupA, true);
    expect(screen.getByRole('button', { name: 'Jump to A' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Back down: A leaves, B is the only group crossing
    report(groupA, false);
    expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});
