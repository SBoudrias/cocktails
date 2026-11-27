import type { Recipe, Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import { screen, within } from '@testing-library/react';
import { createAgent } from '@ui-sdk/react/agent';
import { beforeEach, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import HomePage from './page';

vi.mock('@cocktails/data/recipes', () => ({
  getRecentlyAddedRecipes: vi.fn(),
}));

vi.mock('@cocktails/data/sources', () => ({
  getAllSources: vi.fn(),
}));

const testRecipe: Recipe = {
  name: 'Daiquiri',
  slug: 'daiquiri',
  source: {
    type: 'book',
    name: 'Test Book',
    slug: 'test-book',
    link: 'https://example.com',
    description: 'Test book',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
};

const testSources: Source[] = [];

beforeEach(() => {
  vi.mocked(getAllSources).mockResolvedValue(testSources);
  vi.mocked(getRecentlyAddedRecipes).mockResolvedValue([testRecipe]);
});

describe('HomePage', () => {
  it('pages calculators in a 6-per-page carousel with Fat Wash on page 1 and Juice Clarification on page 2', async () => {
    await setupApp(await HomePage());

    const carousel = screen.getByRole('region', { name: 'Calculators' });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');

    const slides = within(carousel).getAllByRole('group');
    expect(slides).toHaveLength(2);

    const page1 = within(slides[0]!).getByRole('list', {
      name: 'Calculators page 1',
    });
    expect(
      within(page1)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Acid Adjusting',
      'Brix',
      'Fat Wash',
      'Milk Clarification',
      'Saline',
      'Super Juice',
    ]);
    expect(within(page1).getByRole('link', { name: 'Fat Wash' })).toHaveAttribute(
      'href',
      '/calculators/fat-wash',
    );
    expect(
      within(page1).getByRole('link', { name: 'Milk Clarification' }),
    ).toHaveAttribute('href', '/calculators/milk-clarification');

    const page2 = within(slides[1]!).getByRole('list', {
      name: 'Calculators page 2',
    });
    expect(
      within(page2)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Juice Clarification']);
    expect(
      within(page2).getByRole('link', { name: 'Juice Clarification' }),
    ).toHaveAttribute('href', '/calculators/juice-clarification');

    expect(
      within(carousel).getByRole('button', { name: 'Previous calculators' }),
    ).toHaveAttribute('type', 'button');
    expect(
      within(carousel).getByRole('button', { name: 'Next calculators' }),
    ).toHaveAttribute('type', 'button');

    const indicators = within(carousel).getAllByRole('tab', { hidden: true });
    expect(indicators).toHaveLength(2);
    expect(indicators[0]).toHaveAttribute('aria-selected', 'true');

    const agent = createAgent();
    const components = agent.snapshot().filter((entry) => !entry.offPage);
    for (const entry of components) {
      expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
    }
    expect(components.map((entry) => entry.label)).toContain('Calculators');
  });
  it('links to recently added recipes when recent recipe data is available', async () => {
    await setupApp(await HomePage());

    expect(screen.getByRole('link', { name: /recently added/i })).toHaveAttribute(
      'href',
      '/list/recently-added',
    );
  });

  it('hides the recently added link when recent recipe data is unavailable', async () => {
    vi.mocked(getRecentlyAddedRecipes).mockResolvedValue([]);

    await setupApp(await HomePage());

    expect(
      screen.queryByRole('link', { name: /recently added/i }),
    ).not.toBeInTheDocument();
  });

  it('links to the style hub, not each style or the non-alcoholic list', async () => {
    await setupApp(await HomePage());

    expect(screen.getByRole('link', { name: 'By Style' })).toHaveAttribute(
      'href',
      '/list/style',
    );
    expect(
      screen.queryByRole('link', { name: /non-alcoholic/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('By style')).not.toBeInTheDocument();
  });
});
