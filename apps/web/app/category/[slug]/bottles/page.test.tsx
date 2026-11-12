import { getIngredient } from '@cocktails/data/ingredients';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { getIngredientUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import CategoryBottlesPage from './page';

// Rum: a category over the substitution cap, so its full bottle list gets a
// route. Its members include bottles declared directly and via child
// categories (e.g. Blended aged rum (Jamaica)).
const [fourscore] = [await getIngredient('spirit', 'hamilton-jamaican-pot-still-gold')];

beforeEach(() => {
  mockRouter.setCurrentUrl('/');
});

describe('CategoryBottlesPage', () => {
  it('shows the category name as title and its bottles as a list', async () => {
    await setupApp(
      await CategoryBottlesPage({
        params: Promise.resolve({ slug: 'rum' }),
      }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rum bottles' }),
    ).toBeInTheDocument();

    const list = screen.getByRole('list');
    // A Jamaican rum declared through a child category shows up.
    expect(list).toHaveTextContent(fourscore.name);

    // Bottles link to their ingredient page.
    expect(
      within(list).getAllByRole('link', { name: new RegExp(fourscore.name, 'i') })[0],
    ).toHaveAttribute('href', getIngredientUrl(fourscore));
  });

  it('searches within the category bottles', async () => {
    const { user } = await setupApp(
      await CategoryBottlesPage({
        params: Promise.resolve({ slug: 'rum' }),
      }),
    );

    const input = screen.getByRole('searchbox');
    await user.type(input, 'jamaican');

    const resultList = screen.getByRole('list');
    expect(resultList).toHaveTextContent(fourscore.name);
  });

  it('shows no results for a search without matches', async () => {
    const { user } = await setupApp(
      await CategoryBottlesPage({
        params: Promise.resolve({ slug: 'rum' }),
      }),
    );

    await user.type(screen.getByRole('searchbox'), 'xyznonexistent');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
