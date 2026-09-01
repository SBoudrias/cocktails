import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import MilkClarificationCalculatorPage from './page';

describe('MilkClarificationCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification');
  });

  it('calculates the milk to add from the cocktail batch volume', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Cocktail batch volume' })).toHaveValue(
      1000,
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

  it('keeps the batch volume stable while changing measurement units', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.click(screen.getByRole('button', { name: 'oz' }));

    expect(batchVolume).toHaveValue(33.3333);
    expect(screen.getByRole('status')).toHaveTextContent('Add 8.33 oz of whole milk');

    await user.click(screen.getByRole('button', { name: 'ml' }));

    expect(batchVolume).toHaveValue(1000);
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of whole milk');
  });

  it('uses the contextual milk type in the result and method guidance', () => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification?milkType=Coconut%20milk');
    setupApp(<MilkClarificationCalculatorPage />);

    expect(screen.getByRole('combobox', { name: 'Milk' })).toHaveTextContent(
      'Coconut milk',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of coconut milk');
    expect(screen.getByText(/warm it first/i)).toBeInTheDocument();
  });

  it('keeps a custom milk from recipe context available to select', async () => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification?milkType=Almond%20milk');
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const milkType = screen.getByRole('combobox', { name: 'Milk' });

    expect(milkType).toHaveTextContent('Almond milk');
    expect(screen.getByRole('status')).toHaveTextContent('Add 250 ml of almond milk');

    await user.click(milkType);

    expect(screen.getByRole('option', { name: 'Almond milk' })).toBeInTheDocument();
  });

  it('reports an invalid batch volume and shows a concise method', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Cocktail batch volume',
    });

    await user.clear(batchVolume);

    expect(batchVolume).toHaveAccessibleDescription('Must be greater than 0');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Enter a valid batch volume to calculate the milk to add.',
    );
    expect(
      within(screen.getByRole('list', { name: 'Method' })).getAllByRole('listitem'),
    ).toHaveLength(3);
  });
});
