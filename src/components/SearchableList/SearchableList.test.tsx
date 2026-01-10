import { render, screen } from '@testing-library/react';
import SearchableList from './index';

type TestItem = { name: string };

const testItems: TestItem[] = [
  { name: 'Mojito' },
  { name: 'Margarita' },
  { name: 'Mai Tai' },
  { name: 'Daiquiri' },
  { name: 'The Last Word' },
];

const getSearchText = (item: TestItem) => item.name.toLowerCase();

const renderItem = (items: TestItem[], header?: string) => {
  const headerId = header ? `header-${header}` : undefined;
  return (
    <ul role={header ? 'group' : 'list'} aria-labelledby={headerId}>
      {header && <li id={headerId}>{header}</li>}
      {items.map((item) => (
        <li key={item.name}>{item.name}</li>
      ))}
    </ul>
  );
};

const emptyState = (
  <div role="status">
    <p>No results found</p>
  </div>
);

describe('SearchableList', () => {
  it('renders all items grouped by first letter when searchTerm is empty', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm=""
        emptyState={emptyState}
      />,
    );

    // Should have groups for D, L (from "The Last Word"), M
    expect(screen.getByRole('group', { name: 'D' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'L' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'M' })).toBeInTheDocument();
  });

  it('renders all items grouped by first letter when searchTerm is null', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm={null}
        emptyState={emptyState}
      />,
    );

    // All groups should be present
    expect(screen.getByRole('group', { name: 'D' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'L' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'M' })).toBeInTheDocument();
  });

  it('strips articles (the/an/a) when grouping by first letter', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm={null}
        emptyState={emptyState}
      />,
    );

    // "The Last Word" should be grouped under "L", not "T"
    const lGroup = screen.getByRole('group', { name: 'L' });
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(screen.queryByRole('group', { name: 'T' })).not.toBeInTheDocument();
  });

  it('filters items with fuzzy search when searchTerm is provided', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm="moj"
        emptyState={emptyState}
      />,
    );

    const results = screen.getByRole('list');
    expect(results).toHaveTextContent('Mojito');
    expect(results).not.toHaveTextContent('Daiquiri');
    expect(results).not.toHaveTextContent('Margarita');
  });

  it('shows empty state when search has no matches', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm="nonexistent"
        emptyState={emptyState}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('calls renderItem for each group when displaying grouped items', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm={null}
        emptyState={emptyState}
      />,
    );

    // Each group should have its items
    const dGroup = screen.getByRole('group', { name: 'D' });
    const lGroup = screen.getByRole('group', { name: 'L' });
    const mGroup = screen.getByRole('group', { name: 'M' });

    expect(dGroup).toHaveTextContent('Daiquiri');
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
  });

  it('calls renderItem with filtered items when searching', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm="mai"
        emptyState={emptyState}
      />,
    );

    const results = screen.getByRole('list');
    const items = results.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(results).toHaveTextContent('Mai Tai');
  });

  it('handles whitespace-only searchTerm as empty', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm="   "
        emptyState={emptyState}
      />,
    );

    // Should show grouped items, not empty state
    expect(screen.getByRole('group', { name: 'D' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
