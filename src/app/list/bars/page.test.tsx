import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, describe, it, expect } from 'vitest';
import { getBarRecipesUrl } from '@/modules/url';
import { setupApp } from '@/testing';
import BarListPage from './page';

// Real bar data from the codebase
const TEST_BAR = { name: 'Sunken Harbor Club', location: 'Brooklyn, NY' };

describe('BarListPage', () => {
  it('shows search input, title and list', async () => {
    setupApp(await BarListPage());

    expect(screen.getByText('All Bars')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters bar list', async () => {
    const { user } = setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'sunken');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('filters bars by location', async () => {
    const { user } = setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'brooklyn');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('clearing search shows all bars grouped by letter', async () => {
    const { user } = setupApp(await BarListPage(), {
      nuqsOptions: { searchParams: { search: 'sunken' } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('sunken');

    await user.clear(input);

    const groups = screen.queryAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await BarListPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'bar');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=bar' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('does not show SearchAllLink when no results (not searching recipes)', async () => {
    const { user } = setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });

  it('bar items link to correct bar recipes pages', async () => {
    setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveAttribute('href', getBarRecipesUrl(TEST_BAR));
  });

  it('loads with search term from URL', async () => {
    setupApp(await BarListPage(), {
      nuqsOptions: { searchParams: { search: 'sunken' } },
    });

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('sunken');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('groups bars by first letter when not searching', async () => {
    setupApp(await BarListPage());

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);

    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('home button navigates to home', async () => {
    await mockRouter.push('/list/bars');

    setupApp(await BarListPage());

    const homeButton = screen.getByRole('link', { name: /go to home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it('shows recipe count for each bar', async () => {
    setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveTextContent(/\d+/);
  });

  it('shows bar location as secondary text', async () => {
    setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveTextContent(TEST_BAR.location);
  });
});
