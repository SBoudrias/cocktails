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

const renderItem = (items: TestItem[]) => {
  return (
    <ul role="list">
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
  it('renders all items when searchTerm is empty', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm=""
        emptyState={emptyState}
      />,
    );

    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('Mojito');
    expect(list).toHaveTextContent('Margarita');
    expect(list).toHaveTextContent('Mai Tai');
    expect(list).toHaveTextContent('Daiquiri');
    expect(list).toHaveTextContent('The Last Word');
  });

  it('renders all items when searchTerm is null', () => {
    render(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        renderItem={renderItem}
        searchTerm={null}
        emptyState={emptyState}
      />,
    );

    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('Mojito');
    expect(list).toHaveTextContent('Daiquiri');
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

    // Should show all items, not empty state
    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('Mojito');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
