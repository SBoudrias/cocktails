import { format } from 'node:url';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMilkClarificationCalculatorUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import MilkClarificationCalculatorPage from './page';

describe('MilkClarificationCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification');
  });

  it('calculates the milk to add from the cocktail batch volume', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });
    expect(batchVolume).toHaveValue(1000);
    expect(batchVolume).toHaveAccessibleDescription(
      'Cocktail mixture before adding milk.',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of whole milk');
    expect(screen.getByRole('region', { name: 'Milk quantity' })).toHaveTextContent(
      'If following a recipe, use its specified milk quantity instead of this general starting point.',
    );

    const defaultRatio = screen.getByRole('textbox', { name: 'Milk-to-batch ratio' });
    expect(defaultRatio).toHaveValue('25');
    expect(defaultRatio).toHaveAttribute('readonly');

    const campariGuide = screen.getByRole('link', {
      name: 'Campari Academy milk punch guide',
    });
    expect(campariGuide).toHaveAttribute(
      'href',
      'https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/',
    );
    expect(campariGuide).toHaveAttribute('target', '_blank');
  });

  it('prefills the batch volume, unit, and recipe ratio from recipe context', () => {
    mockRouter.setCurrentUrl(
      format(
        getMilkClarificationCalculatorUrl({
          milkType: 'Whole milk',
          batchQuantity: { amount: 19.5, unit: 'oz' },
          ratio: 150 / 585,
        }),
      ),
    );
    setupApp(<MilkClarificationCalculatorPage />);

    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });
    expect(batchVolume).toHaveValue(19.5);
    expect(screen.getByRole('button', { name: 'oz' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Add 5 oz of whole milk');

    const recipeRatio = screen.getByRole('textbox', {
      name: 'Recipe milk-to-batch ratio',
    });
    expect(recipeRatio).toHaveValue('25.6');
    expect(recipeRatio).toHaveAttribute('readonly');
    expect(screen.getByRole('region', { name: 'Milk quantity' })).not.toHaveTextContent(
      'If following a recipe, use its specified milk quantity',
    );
  });

  it('falls back to the default batch volume for a nonsense prefill', () => {
    mockRouter.setCurrentUrl(
      format(
        getMilkClarificationCalculatorUrl({
          milkType: 'Whole milk',
          batchQuantity: { amount: Number('nonsense'), unit: 'oz' },
          ratio: Number('nonsense'),
        }),
      ),
    );
    setupApp(<MilkClarificationCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Cocktail batch volume' })).toHaveValue(
      1000,
    );
    expect(screen.getByRole('textbox', { name: 'Milk-to-batch ratio' })).toHaveValue(
      '25',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of whole milk');
  });

  it('recalculates when the cocktail batch volume changes', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.clear(batchVolume);
    await user.type(batchVolume, '400');

    expect(screen.getByRole('status')).toHaveTextContent('Add 100 ml of whole milk');
  });

  it('rounds converted volumes to friendly measurements when switching units', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.click(screen.getByRole('button', { name: 'oz' }));

    expect(batchVolume).toHaveValue(33.25);
    expect(screen.getByRole('status')).toHaveTextContent('Add 8.25 oz of whole milk');

    await user.click(screen.getByRole('button', { name: 'ml' }));

    expect(batchVolume).toHaveValue(1000);
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of whole milk');
  });

  it('uses the contextual milk type in the result and guidance', () => {
    mockRouter.setCurrentUrl(
      format(getMilkClarificationCalculatorUrl({ milkType: 'Coconut milk' })),
    );
    setupApp(<MilkClarificationCalculatorPage />);

    expect(screen.getByRole('combobox', { name: 'Milk' })).toHaveTextContent(
      'Coconut milk',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of coconut milk');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Results vary by product, so test a small batch before scaling up.',
    );
  });

  it('keeps a custom milk from recipe context available to select', async () => {
    mockRouter.setCurrentUrl(
      format(getMilkClarificationCalculatorUrl({ milkType: 'Almond milk' })),
    );
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const milkType = screen.getByRole('combobox', { name: 'Milk' });

    expect(milkType).toHaveTextContent('Almond milk');
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of almond milk');

    await user.click(milkType);

    await user.click(screen.getByRole('option', { name: 'Whole milk' }));
    expect(milkType).toHaveTextContent('Whole milk');

    await user.click(milkType);
    await user.click(screen.getByRole('option', { name: 'Almond milk' }));

    expect(milkType).toHaveTextContent('Almond milk');
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of almond milk');
  });

  it('round-trips an edited ounce volume without changing the batch', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.click(screen.getByRole('button', { name: 'oz' }));
    await user.clear(batchVolume);
    await user.type(batchVolume, '12.5');
    expect(screen.getByRole('status')).toHaveTextContent('Add 3.25 oz of whole milk');

    await user.click(screen.getByRole('button', { name: 'ml' }));
    expect(batchVolume).toHaveValue(375);
    expect(screen.getByRole('status')).toHaveTextContent('Add 95 ml of whole milk');

    await user.click(screen.getByRole('button', { name: 'oz' }));
    expect(batchVolume).toHaveValue(12.5);
    expect(screen.getByRole('status')).toHaveTextContent('Add 3.25 oz of whole milk');
  });

  it.each(['', '0', '-10'])(
    'preserves invalid input %j when changing units and recovers on a valid edit',
    async (value) => {
      const { user } = setupApp(<MilkClarificationCalculatorPage />);
      const batchVolume = screen.getByRole('spinbutton', {
        name: 'Cocktail batch volume',
      });
      await user.clear(batchVolume);
      if (value) {
        await user.type(batchVolume, value);
      }

      for (const unit of ['oz', 'ml', 'oz']) {
        await user.click(screen.getByRole('button', { name: unit }));
        expect(batchVolume).toHaveValue(value === '' ? null : Number(value));
        expect(batchVolume).toHaveAccessibleDescription('Must be greater than 0');
        expect(screen.getByRole('status')).toHaveTextContent(
          'Enter a valid batch volume to calculate the milk to add.',
        );
      }

      await user.clear(batchVolume);
      await user.type(batchVolume, '4');
      expect(screen.getByRole('status')).toHaveTextContent('Add 1 oz of whole milk');
      await user.click(screen.getByRole('button', { name: 'ml' }));
      expect(batchVolume).toHaveValue(120);
      expect(screen.getByRole('status')).toHaveTextContent('Add 30 ml of whole milk');
    },
  );

  it.each(['', '   ', ' wHoLe   MiLk '])(
    'normalizes milk query %j to whole milk without duplicate options',
    async (value) => {
      mockRouter.setCurrentUrl(
        format(getMilkClarificationCalculatorUrl({ milkType: value })),
      );
      const { user } = setupApp(<MilkClarificationCalculatorPage />);
      const milkType = screen.getByRole('combobox', { name: 'Milk' });

      expect(milkType).toHaveTextContent('Whole milk');
      expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of whole milk');
      expect(screen.getByRole('status')).not.toHaveTextContent(/test a small batch/i);
      await user.click(milkType);
      expect(screen.getAllByRole('option', { name: 'Whole milk' })).toHaveLength(1);
    },
  );

  it.each(['Coconut milk', 'Other milk', 'Almond milk', 'Almond & oat + coconut milk'])(
    'provides small-batch guidance for %s',
    (milk) => {
      mockRouter.setCurrentUrl(
        format(getMilkClarificationCalculatorUrl({ milkType: milk })),
      );
      setupApp(<MilkClarificationCalculatorPage />);

      const milkType = screen.getByRole('combobox', { name: 'Milk' });
      expect(milkType).toHaveTextContent(milk);
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(`Add 250 ml of ${milk.toLowerCase()}`);
      expect(status).toHaveTextContent(
        'Results vary by product, so test a small batch before scaling up.',
      );
    },
  );

  it('normalizes a coconut milk query', () => {
    mockRouter.setCurrentUrl(
      format(getMilkClarificationCalculatorUrl({ milkType: '  cOcOnUt   MILK ' })),
    );
    setupApp(<MilkClarificationCalculatorPage />);

    const milkType = screen.getByRole('combobox', { name: 'Milk' });
    expect(milkType).toHaveTextContent('Coconut milk');
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of coconut milk');
  });

  it('reports an invalid batch volume', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.clear(batchVolume);

    expect(batchVolume).toHaveAccessibleDescription('Must be greater than 0');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Enter a valid batch volume to calculate the milk to add.',
    );
  });

  it('renders the numbered instructions like a recipe', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    const instructions = screen.getByRole('region', { name: 'Instructions' });
    // The "Instructions" subheader is itself an <li>, like on recipe pages
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(4);

    expect(instructions).toHaveTextContent('1. Make sure the cocktail batch');
    expect(instructions).toHaveTextContent(
      '2. Put the 250 ml of whole milk in a large container',
    );
    expect(instructions).toHaveTextContent('3. Rest for at least 15 minutes');
    expect(instructions).toHaveTextContent(/stop stirring when curds form/i);
    expect(instructions).toHaveTextContent(
      /pour the first cloudy filtrate back through/i,
    );
  });

  it('warns about retained allergens inside the calculator card', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/still contains dairy allergens/i);
    expect(alert).toHaveTextContent(/nut or soy allergens/i);
    expect(screen.getByRole('region', { name: 'Milk quantity' })).toContainElement(alert);
  });

  it('moves the coconut milk warming pre-step into the instructions', () => {
    mockRouter.setCurrentUrl(
      format(getMilkClarificationCalculatorUrl({ milkType: 'Coconut milk' })),
    );
    setupApp(<MilkClarificationCalculatorPage />);

    const instructions = screen.getByRole('region', { name: 'Instructions' });
    // Coconut milk prepends the warming step; the subheader is also an <li>
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(5);
    expect(instructions).toHaveTextContent('1. Warm it first if needed to emulsify.');
    expect(instructions).toHaveTextContent('2. Make sure the cocktail batch');
  });

  it('links to all milk-clarified recipes', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    expect(
      screen.getByRole('link', { name: 'Browse milk-clarified recipes' }),
    ).toHaveAttribute('href', '/list/milk-clarification');
  });
});
