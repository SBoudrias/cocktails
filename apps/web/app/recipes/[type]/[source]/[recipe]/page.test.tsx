import { getRecipe } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMilkClarificationCalculatorUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import RecipePage from './page';

describe('RecipePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
    expect(techniqueDetails).toHaveTextContent('5 oz Whole milk');
    expect(within(technique).queryByRole('link')).not.toBeInTheDocument();

    const calculatorLink = screen.getByRole('link', {
      name: 'Calculate milk for a batch',
    });
    // The action is separate from the milk quantity, not a label overriding it.
    expect(calculatorLink).toHaveTextContent(/^Calculate milk for a batch$/);
    expect(calculatorLink).not.toHaveAttribute('aria-label');
    const calculatorUrl = new URL(
      calculatorLink.getAttribute('href') ?? '',
      'https://cocktail-index.test',
    );

    expect(calculatorUrl.pathname).toBe(
      getMilkClarificationCalculatorUrl({ milkType: 'Whole milk' }).pathname,
    );
    // 19 oz batch: the floated red wine is not part of the clarified mixture
    expect([...calculatorUrl.searchParams.entries()]).toEqual([
      ['milkType', 'Whole milk'],
      ['amount', '19'],
      ['unit', 'oz'],
      ['ratio', '0.2632'],
    ]);

    await user.click(screen.getByRole('button', { name: 'ml' }));

    expect(techniqueDetails).toHaveTextContent('150 ml Whole milk');

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    // One more serving on top of the author's 10-serving batch
    expect(techniqueDetails).toHaveTextContent('165 ml Whole milk');
    expect(calculatorLink).toHaveTextContent(/^Calculate milk for a batch$/);
  });
});
