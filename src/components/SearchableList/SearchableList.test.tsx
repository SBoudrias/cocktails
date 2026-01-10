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

const renderItem = (items: TestItem[], header?: string) => (
  <ul data-testid={header ? `group-${header}` : 'results'}>
    {header && <li data-testid="header">{header}</li>}
    {items.map((item) => (
      <li key={item.name} data-testid="item">
        {item.name}
      </li>
    ))}
  </ul>
);

const emptyState = <div data-testid="empty-state">No results found</div>;

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
    expect(screen.getByTestId('group-D')).toBeInTheDocument();
    expect(screen.getByTestId('group-L')).toBeInTheDocument();
    expect(screen.getByTestId('group-M')).toBeInTheDocument();
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
    expect(screen.getByTestId('group-D')).toBeInTheDocument();
    expect(screen.getByTestId('group-L')).toBeInTheDocument();
    expect(screen.getByTestId('group-M')).toBeInTheDocument();
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
    const lGroup = screen.getByTestId('group-L');
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(screen.queryByTestId('group-T')).not.toBeInTheDocument();
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

    const results = screen.getByTestId('results');
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

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
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

    // Each group should have a header
    const headers = screen.getAllByTestId('header');
    expect(headers).toHaveLength(3); // D, L, M
    expect(headers[0]).toHaveTextContent('D');
    expect(headers[1]).toHaveTextContent('L');
    expect(headers[2]).toHaveTextContent('M');
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

    const results = screen.getByTestId('results');
    const items = screen.getAllByTestId('item');
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
    expect(screen.getByTestId('group-D')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});
