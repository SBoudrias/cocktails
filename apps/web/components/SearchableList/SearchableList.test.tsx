import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { byNameListConfig } from '#/modules/lists/by-name';
import { setupApp } from '#/vitest.setup';
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

const renderItem = (item: TestItem) => <li key={item.name}>{item.name}</li>;

const emptyState = (
  <div role="status">
    <p>No results found</p>
  </div>
);

describe('SearchableList', () => {
  it.each([
    { searchTerm: '', reason: 'empty' },
    { searchTerm: null, reason: 'null' },
  ])(
    'renders all items grouped by first letter when searchTerm is $reason',
    async ({ searchTerm }) => {
      await setupApp(
        <SearchableList
          items={testItems}
          getSearchText={getSearchText}
          config={byNameListConfig}
          renderItem={renderItem}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />,
      );

      // Should have groups for D, L (from "The Last Word"), M
      expect(screen.getByRole('group', { name: 'D' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'L' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'M' })).toBeInTheDocument();
    },
  );

  it('strips articles (the/an/a) when grouping by first letter', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
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

  it('filters items with fuzzy search when searchTerm is provided', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderItem}
        searchTerm="moj"
        emptyState={emptyState}
      />,
    );

    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.queryByText('Daiquiri')).not.toBeInTheDocument();
    expect(screen.queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no matches', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderItem}
        searchTerm="nonexistent"
        emptyState={emptyState}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders each group with its items', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderItem}
        searchTerm={null}
        emptyState={emptyState}
      />,
    );

    const dGroup = screen.getByRole('group', { name: 'D' });
    const lGroup = screen.getByRole('group', { name: 'L' });
    const mGroup = screen.getByRole('group', { name: 'M' });

    expect(dGroup).toHaveTextContent('Daiquiri');
    expect(lGroup).toHaveTextContent('The Last Word');
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
  });

  it('renders only matching items when searching', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
        renderItem={renderItem}
        searchTerm="mai"
        emptyState={emptyState}
      />,
    );

    expect(screen.getByText('Mai Tai')).toBeInTheDocument();
    expect(screen.queryByText('Mojito')).not.toBeInTheDocument();
  });

  it('handles whitespace-only searchTerm as empty', async () => {
    await setupApp(
      <SearchableList
        items={testItems}
        getSearchText={getSearchText}
        config={byNameListConfig}
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

describe('SearchableList rows mode', () => {
  // Rows a server page rendered: node + the data to search and group by.
  const testRows = testItems.map((item) => ({
    name: item.name,
    node: <li key={item.name}>{item.name}</li>,
    searchText: item.name.toLowerCase(),
  }));

  it('renders pre-rendered rows grouped by name when no term is passed', async () => {
    await setupApp(
      <SearchableList
        rows={testRows}
        emptyState={emptyState}
      />,
    );

    const mGroup = screen.getByRole('group', { name: 'M' });
    expect(mGroup).toHaveTextContent('Mojito');
    expect(mGroup).toHaveTextContent('Margarita');
    expect(mGroup).toHaveTextContent('Mai Tai');
  });

  it('filters pre-rendered rows from the ?search URL parameter', async () => {
    mockRouter.setCurrentUrl('/?search=moj');
    await setupApp(
      <SearchableList
        rows={testRows}
        emptyState={emptyState}
      />,
    );

    expect(screen.getByText('Mojito')).toBeInTheDocument();
    expect(screen.queryByText('Mai Tai')).not.toBeInTheDocument();
  });

  it('shows the empty state when no row matches the URL parameter', async () => {
    mockRouter.setCurrentUrl('/?search=nonexistent');
    await setupApp(
      <SearchableList
        rows={testRows}
        emptyState={emptyState}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
