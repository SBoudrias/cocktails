import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LinkList, LinkListItem } from './index';

type TestItem = { id: string; name: string; category: string };

const testItems: TestItem[] = [
  { id: '1', name: 'Apple', category: 'A' },
  { id: '2', name: 'Banana', category: 'B' },
  { id: '3', name: 'Avocado', category: 'A' },
  { id: '4', name: 'Blueberry', category: 'B' },
];

const renderItem = (item: TestItem) => <LinkListItem key={item.id} primary={item.name} />;

describe('LinkList', () => {
  describe('without groupBy', () => {
    it('renders items as a flat list', () => {
      render(<LinkList items={testItems} renderItem={renderItem} />);

      const list = screen.getByRole('list');
      expect(list).toHaveTextContent('Apple');
      expect(list).toHaveTextContent('Banana');
      expect(list).toHaveTextContent('Avocado');
      expect(list).toHaveTextContent('Blueberry');
    });

    it('renders with header when provided', () => {
      render(<LinkList items={testItems} header="Fruits" renderItem={renderItem} />);

      const group = screen.getByRole('group', { name: 'Fruits' });
      expect(group).toHaveTextContent('Apple');
      expect(group).toHaveTextContent('Banana');
    });
  });

  describe('with groupBy', () => {
    it('groups items by the provided function', () => {
      render(
        <LinkList
          items={testItems}
          groupBy={(item) => item.category}
          renderItem={renderItem}
        />,
      );

      const groupA = screen.getByRole('group', { name: 'A' });
      const groupB = screen.getByRole('group', { name: 'B' });

      expect(groupA).toHaveTextContent('Apple');
      expect(groupA).toHaveTextContent('Avocado');
      expect(groupA).not.toHaveTextContent('Banana');

      expect(groupB).toHaveTextContent('Banana');
      expect(groupB).toHaveTextContent('Blueberry');
      expect(groupB).not.toHaveTextContent('Apple');
    });

    it('sorts groups alphabetically', () => {
      const items: TestItem[] = [
        { id: '1', name: 'Zebra', category: 'Z' },
        { id: '2', name: 'Apple', category: 'A' },
        { id: '3', name: 'Mango', category: 'M' },
      ];

      render(
        <LinkList
          items={items}
          groupBy={(item) => item.category}
          renderItem={renderItem}
        />,
      );

      const groups = screen.getAllByRole('group');
      expect(groups[0]).toHaveTextContent('Apple');
      expect(groups[1]).toHaveTextContent('Mango');
      expect(groups[2]).toHaveTextContent('Zebra');
    });
  });
});

describe('LinkListItem', () => {
  it('renders primary text', () => {
    render(<LinkListItem primary="Test Item" />);
    expect(screen.getByRole('listitem')).toHaveTextContent('Test Item');
  });

  it('renders secondary text when provided', () => {
    render(<LinkListItem primary="Test Item" secondary="Secondary text" />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Test Item');
    expect(item).toHaveTextContent('Secondary text');
  });

  it('renders as a link when href is provided', () => {
    render(<LinkListItem primary="Test Item" href="/test" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders tertiary content when provided', () => {
    render(<LinkListItem primary="Test Item" tertiary={<span data-test>Extra</span>} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Extra');
  });
});
