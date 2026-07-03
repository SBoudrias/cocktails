import { getRecipe } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import RecipePage from './page';

describe('RecipePage', () => {
  it('renders book chapter beside the page number when available', async () => {
    const bookRecipe = await getRecipe(
      { type: 'book', slug: 'smugglers-cove' },
      'jungle-bird',
    );

    setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: bookRecipe.source.type,
          source: bookRecipe.source.slug,
          recipe: bookRecipe.slug,
        }),
      }),
    );

    expect(screen.getByText('The Tiki Revival · page 96')).toBeInTheDocument();
  });

  it('renders whole-recipe clarification in a scalable technique section', async () => {
    const clarifiedRecipe = await getRecipe(
      { type: 'youtube-channel', slug: 'truffles-on-the-rocks' },
      'clarified-new-york-sour',
    );

    const { user } = setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: clarifiedRecipe.source.type,
          source: clarifiedRecipe.source.slug,
          recipe: clarifiedRecipe.slug,
        }),
      }),
    );

    const recipeContent = screen.getByRole('main');
    expect(recipeContent).toHaveTextContent('stirred');
    expect(screen.queryByText('Whole milk clarified')).not.toBeInTheDocument();

    const technique = screen.getByRole('list', { name: 'Milk clarification' });
    const techniqueDetails = within(technique).getByRole('listitem');
    expect(techniqueDetails).not.toHaveTextContent('Milk clarification');
    expect(techniqueDetails).toHaveTextContent('5ozWhole milk');

    await user.click(screen.getByRole('button', { name: 'ml' }));

    expect(techniqueDetails).toHaveTextContent('150mlWhole milk');

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    expect(techniqueDetails).toHaveTextContent('300mlWhole milk');
  });
});
