import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { setupApp } from '#/testing';
import MilkClarificationCalculatorPage from './page';

describe('MilkClarificationCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification');
  });

  it('calculates milk from the pre-milk batch volume and ratio', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    expect(
      screen.getByRole('spinbutton', { name: 'Pre-milk cocktail batch volume' }),
    ).toHaveValue(1000);
    expect(screen.getByRole('spinbutton', { name: 'Milk ratio' })).toHaveValue(25);
    const results = screen.getByRole('status', { name: 'Calculated quantities' });
    expect(results).toHaveTextContent('Milk required250 ml');
    expect(results).toHaveTextContent('Combined pre-filtration volume1,250 ml');
  });

  it('recalculates when the batch volume and ratio change', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Pre-milk cocktail batch volume',
    });
    const milkRatio = screen.getByRole('spinbutton', { name: 'Milk ratio' });

    await user.clear(batchVolume);
    await user.type(batchVolume, '400');
    await user.clear(milkRatio);
    await user.type(milkRatio, '30');

    const results = screen.getByRole('status', { name: 'Calculated quantities' });
    expect(results).toHaveTextContent('Milk required120 ml');
    expect(results).toHaveTextContent('Combined pre-filtration volume520 ml');
  });

  it('converts the current batch when the measurement unit changes', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'oz' }));

    expect(
      screen.getByRole('spinbutton', { name: 'Pre-milk cocktail batch volume' }),
    ).toHaveValue(33.3333);
    const results = screen.getByRole('status', { name: 'Calculated quantities' });
    expect(results).toHaveTextContent('Milk required8.33 oz');
    expect(results).toHaveTextContent('Combined pre-filtration volume41.67 oz');
  });

  it('shows milk-specific guidance', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const milkType = screen.getByRole('combobox', { name: 'Milk type' });

    expect(screen.getByText(/whole milk contains dairy/i)).toBeInTheDocument();

    await user.click(milkType);
    await user.click(screen.getByRole('option', { name: 'Coconut milk' }));

    expect(screen.getByText(/coconut milk products vary/i)).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Instructions' })).getByText(
        /60°C \(140°F\)/,
      ),
    ).toBeInTheDocument();

    await user.click(milkType);
    await user.click(screen.getByRole('option', { name: 'Other milk' }));

    expect(screen.getByText(/other milks are experimental/i)).toBeInTheDocument();
  });

  it('reports invalid inputs accessibly and clears calculated quantities', async () => {
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Pre-milk cocktail batch volume',
    });
    const milkRatio = screen.getByRole('spinbutton', { name: 'Milk ratio' });

    await user.clear(batchVolume);

    expect(batchVolume).toHaveAccessibleDescription('Must be greater than 0');
    expect(
      screen.getByRole('status', { name: 'Calculated quantities' }),
    ).toHaveTextContent(
      'Enter a valid batch volume and milk ratio to calculate quantities.',
    );

    await user.type(batchVolume, '100');
    await user.clear(milkRatio);
    await user.type(milkRatio, '101');

    expect(milkRatio).toHaveAccessibleDescription('Must be between 0 and 100');
    expect(
      screen.getByRole('status', { name: 'Calculated quantities' }),
    ).not.toHaveTextContent('Milk required');
  });

  it('uses and resets to contextual URL defaults without following later URL changes', async () => {
    mockRouter.setCurrentUrl(
      '/calculators/milk-clarification?batchVolume=20&unit=oz&milkRatio=30&milkType=Coconut%20milk',
    );
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const batchVolume = screen.getByRole('spinbutton', {
      name: 'Pre-milk cocktail batch volume',
    });

    expect(batchVolume).toHaveValue(20);
    expect(screen.getByRole('spinbutton', { name: 'Milk ratio' })).toHaveValue(30);
    expect(screen.getByRole('combobox', { name: 'Milk type' })).toHaveTextContent(
      'Coconut milk',
    );
    const results = screen.getByRole('status', { name: 'Calculated quantities' });
    expect(results).toHaveTextContent('Milk required6 oz');
    expect(results).toHaveTextContent('Combined pre-filtration volume26 oz');

    await user.clear(batchVolume);
    await user.type(batchVolume, '10');
    await mockRouter.push('?batchVolume=40&unit=oz');

    expect(batchVolume).toHaveValue(10);

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(batchVolume).toHaveValue(20);
    expect(screen.getByRole('spinbutton', { name: 'Milk ratio' })).toHaveValue(30);
  });

  it('falls back from malformed contextual parameters', () => {
    mockRouter.setCurrentUrl(
      '/calculators/milk-clarification?batchVolume=-1&unit=litre&milkRatio=200&milkType=%20',
    );
    setupApp(<MilkClarificationCalculatorPage />);

    expect(
      screen.getByRole('spinbutton', { name: 'Pre-milk cocktail batch volume' }),
    ).toHaveValue(1000);
    expect(screen.getByRole('spinbutton', { name: 'Milk ratio' })).toHaveValue(25);
    expect(screen.getByRole('combobox', { name: 'Milk type' })).toHaveTextContent(
      'Whole milk',
    );
  });

  it('preserves a custom canonical milk type from the recipe context and reset', async () => {
    mockRouter.setCurrentUrl('/calculators/milk-clarification?milkType=Almond%20milk');
    const { user } = setupApp(<MilkClarificationCalculatorPage />);
    const milkType = screen.getByRole('combobox', { name: 'Milk type' });

    expect(milkType).toHaveTextContent('Almond milk');
    expect(
      screen.getByText(/almond milk is treated as a custom milk/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/whole milk contains dairy/i)).not.toBeInTheDocument();

    await user.click(milkType);
    await user.click(screen.getByRole('option', { name: 'Coconut milk' }));
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(milkType).toHaveTextContent('Almond milk');
    expect(
      screen.getByText(/almond milk is treated as a custom milk/i),
    ).toBeInTheDocument();
  });

  it('shows the procedure, source, and scientific limitations', () => {
    setupApp(<MilkClarificationCalculatorPage />);

    const instructions = screen.getByRole('list', { name: 'Instructions' });
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(5);
    expect(instructions).toHaveTextContent('acidic or astringent ingredients');
    expect(instructions).toHaveTextContent('Return the initially cloudy liquid');
    expect(
      screen.getByRole('link', { name: 'Campari Academy milk punch guide' }),
    ).toHaveAttribute(
      'href',
      'https://www.campariacademy.com/en-us/training/tools-techniques/milk-punch-guide-and-recipes/',
    );

    const limitations = screen.getByRole('list', { name: 'Limitations' });
    expect(limitations).toHaveTextContent('not a guarantee');
    expect(limitations).toHaveTextContent('does not determine acid or pH requirements');
    expect(limitations).toHaveTextContent('does not provide shelf-life');
  });
});
