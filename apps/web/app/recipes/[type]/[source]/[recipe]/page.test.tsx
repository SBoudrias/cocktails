import { getRecipe } from '@cocktails/data/recipes';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setupApp } from '#/testing';
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
});
