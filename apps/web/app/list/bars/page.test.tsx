import type { Attribution } from '@cocktails/data';
import { getAllRecipes, getRecipe } from '@cocktails/data/recipes';
import type * as RecipesModule from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { getBarRecipesUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import BarListPage from './page';

vi.mock('@cocktails/data/recipes', async (importOriginal) => ({
  ...(await importOriginal<typeof RecipesModule>()),
  getAllRecipes: vi.fn(),
}));

// Real bar data from the codebase
const TEST_BAR = { name: 'Sunken Harbor Club', location: 'Brooklyn, NY' };

const testRecipes = await Promise.all([
  getRecipe(
    { type: 'book', slug: 'tropical-standard' },
    'daiquiri',
    '02_Preparations - Shaken - Up',
  ),
  getRecipe(
    { type: 'book', slug: 'tropical-standard' },
    'mojito',
    '04_Preparations - Shaken - Collins',
  ),
]);

beforeEach(() => {
  localStorage.removeItem('bars-grouping');
  vi.mocked(getAllRecipes).mockResolvedValue(testRecipes);
});

describe('BarListPage', () => {
  it('shows search input, title and list', async () => {
    await setupApp(await BarListPage());

    expect(screen.getByText('All Bars')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('typing filters bar list', async () => {
    const { user } = await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'sunken');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('filters bars by location', async () => {
    const { user } = await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'brooklyn');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('clearing search shows all bars grouped by letter', async () => {
    mockRouter.setCurrentUrl('?search=sunken');
    const { user } = await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('sunken');

    await user.clear(input);

    const groups = screen.queryAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('URL updates with search param when typing', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = await setupApp(await BarListPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const input = screen.getByRole('searchbox');
    await user.type(input, 'bar');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?search=bar' }),
    );
  });

  it('shows no results when search has no matches', async () => {
    const { user } = await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('does not show SearchAllLink when no results (not searching recipes)', async () => {
    const { user } = await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /search all recipes/i }),
    ).not.toBeInTheDocument();
  });

  it('bar items link to correct bar recipes pages', async () => {
    await setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveAttribute('href', getBarRecipesUrl(TEST_BAR));
  });

  it('loads with search term from URL', async () => {
    mockRouter.setCurrentUrl('?search=sunken');
    await setupApp(await BarListPage());

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('sunken');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(TEST_BAR.name);
  });

  it('groups bars by first letter when not searching', async () => {
    await setupApp(await BarListPage());

    // The toggle group has aria-label; list groups are labeled by their header
    const groups = screen
      .getAllByRole('group')
      .filter((group) => group.getAttribute('aria-labelledby') !== null);
    expect(groups.length).toBeGreaterThan(0);

    const firstGroup = groups[0]!;
    const items = within(firstGroup).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('shows recipe count for each bar', async () => {
    await setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveTextContent(/\d+/);
  });

  it('shows bar location as secondary text', async () => {
    await setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveTextContent(TEST_BAR.location);
  });

  it('shows grouping toggle with A-Z selected by default', async () => {
    await setupApp(await BarListPage());

    expect(screen.getByRole('group', { name: /bar grouping/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /a-z/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /by city/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('loads city grouping mode from localStorage', async () => {
    localStorage.setItem('bars-grouping', '"city"');
    await setupApp(await BarListPage());

    expect(screen.getByRole('button', { name: /by city/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('persists grouping preference in localStorage', async () => {
    const { user } = await setupApp(await BarListPage());

    await user.click(screen.getByRole('button', { name: /by city/i }));

    expect(localStorage.getItem('bars-grouping')).toBe('"city"');
  });

  it('hides grouping toggle when searching', async () => {
    const { user } = await setupApp(await BarListPage());

    expect(screen.getByRole('group', { name: /bar grouping/i })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'sunken');

    expect(
      screen.queryByRole('group', { name: /bar grouping/i }),
    ).not.toBeInTheDocument();
  });
});

const barAttribution = (source: string, location?: string): Attribution => ({
  relation: 'bar',
  source,
  location,
});

const multiCityRecipes = testRecipes.flatMap((recipe) => [
  recipe,
  {
    ...recipe,
    slug: `${recipe.slug}-orleans`,
    attributions: [barAttribution('Latitude 29', 'New Orleans, LA')],
  },
  {
    ...recipe,
    slug: `${recipe.slug}-unknown`,
    attributions: [barAttribution('Mystery Bar')],
  },
]);

describe('BarListPage city grouping', () => {
  beforeEach(() => {
    vi.mocked(getAllRecipes).mockResolvedValue(multiCityRecipes);
  });

  it('switches to city grouping when By City is clicked', async () => {
    const { user } = await setupApp(await BarListPage());

    await user.click(screen.getByRole('button', { name: /by city/i }));

    const brooklynGroup = screen.getByRole('group', { name: 'Brooklyn, NY' });
    expect(brooklynGroup).toHaveTextContent(TEST_BAR.name);
    expect(screen.getByRole('group', { name: 'New Orleans, LA' })).toHaveTextContent(
      'Latitude 29',
    );
  });

  it('hides the location sub-label in city mode: the header already carries it', async () => {
    const { user } = await setupApp(await BarListPage());

    await user.click(screen.getByRole('button', { name: /by city/i }));

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).not.toHaveTextContent(TEST_BAR.location!);
  });

  it('keeps the location sub-label in A-Z mode', async () => {
    await setupApp(await BarListPage());

    const link = screen.getByRole('link', { name: new RegExp(TEST_BAR.name, 'i') });
    expect(link).toHaveTextContent(TEST_BAR.location!);
  });

  it('switches back to A-Z grouping when the toggle is clicked back', async () => {
    localStorage.setItem('bars-grouping', '"city"');
    const { user } = await setupApp(await BarListPage());

    await user.click(screen.getByRole('button', { name: /a-z/i }));

    expect(localStorage.getItem('bars-grouping')).toBe('"alpha"');
  });

  it('orders locations alphabetically, Unknown last', async () => {
    localStorage.setItem('bars-grouping', '"city"');
    await setupApp(await BarListPage());

    const groups = screen.getAllByRole('group');
    const headerNames = groups.map((group) => group.getAttribute('aria-labelledby'));
    const cityNames = headerNames
      .map((id) => document.getElementById(id ?? ''))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.textContent);

    expect(cityNames).toEqual(['Brooklyn, NY', 'New Orleans, LA', 'Unknown']);
  });

  it('groups bars without a location under Unknown', async () => {
    localStorage.setItem('bars-grouping', '"city"');
    await setupApp(await BarListPage());

    const unknownGroup = screen.getByRole('group', { name: 'Unknown' });
    expect(unknownGroup).toHaveTextContent('Mystery Bar');
  });
});
