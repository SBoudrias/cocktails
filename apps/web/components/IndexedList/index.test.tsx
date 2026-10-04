import { fireEvent, render, screen } from '@testing-library/react';
import IndexedList from './index';

type TestItem = { id: string; name: string };

const renderItem = (item: TestItem) => <li key={item.id}>{item.name}</li>;

const letterConfig = {
  groupBy: (item: TestItem) => item.name[0]!.toUpperCase(),
  sortItemBy: (a: TestItem, b: TestItem) => a.name.localeCompare(b.name),
  sortHeaderBy: (a: string, b: string) => a.localeCompare(b),
};

describe('IndexedList', () => {
  it('derives the available letter indexes from the grouped items', () => {
    render(
      <IndexedList
        items={[
          { id: '1', name: 'Apple' },
          { id: '2', name: 'Avocado' },
          { id: '3', name: 'Banana' },
        ]}
        renderItem={renderItem}
        config={letterConfig}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Alphabet index' });

    // Only letters with content are focusable
    expect(nav.querySelector('[data-index="A"]')).toHaveAttribute('tabIndex', '0');
    expect(nav.querySelector('[data-index="B"]')).toHaveAttribute('tabIndex', '0');
    expect(nav.querySelector('[data-index="C"]')).toHaveAttribute('tabIndex', '-1');
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

  it('scrolls to the matching group header when a letter is selected', () => {
    const scrolled: Array<string | undefined> = [];
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset.header);
    });

    render(
      <IndexedList
        items={[
          { id: '1', name: 'Apple' },
          { id: '2', name: 'Banana' },
        ]}
        renderItem={renderItem}
        config={letterConfig}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Jump to B' }));

    expect(scrolled).toEqual(['B']);

    vi.restoreAllMocks();
  });

  it('scrolls to the mapped chapter header when a numeric index is selected', () => {
    const scrolled: Array<string | undefined> = [];
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (
      this: HTMLElement,
    ) {
      scrolled.push(this.dataset.header);
    });

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

    fireEvent.click(screen.getByRole('button', { name: 'Jump to The Golden Era' }));

    expect(scrolled).toEqual(['The Golden Era']);

    vi.restoreAllMocks();
  });
});
