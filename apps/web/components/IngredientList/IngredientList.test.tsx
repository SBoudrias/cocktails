import type { Recipe } from '@cocktails/data';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import IngredientList from './index';

function getLinkSearchParams(name: string | RegExp) {
  const href = screen.getByRole('link', { name }).getAttribute('href');
  if (href == null) {
    throw new Error('Expected ingredient link to have an href');
  }
  return new URL(href, 'https://example.com').searchParams;
}

describe('IngredientList', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const mockIngredients: Recipe['ingredients'] = [
    {
      name: 'Gin',
      slug: 'gin',
      type: 'spirit',
      quantity: { amount: 2, unit: 'oz' as const },
      categories: [],
      refs: [],
      ingredients: [],
    },
    {
      name: 'Lemon Juice',
      slug: 'lemon-juice',
      type: 'juice',
      quantity: { amount: 1, unit: 'oz' as const },
      categories: [],
      refs: [],
      ingredients: [],
    },
  ];

  it('should render serving selector with default value of 1', () => {
    render(<IngredientList ingredients={mockIngredients} />);

    const servingInput = screen.getByLabelText('Number of servings');
    expect(servingInput).toHaveValue(1);
  });

  it('should use provided default servings', () => {
    render(<IngredientList ingredients={mockIngredients} defaultServings={4} />);

    const servingInput = screen.getByLabelText('Number of servings');
    expect(servingInput).toHaveValue(4);
  });

  it('should update serving size when user changes input', () => {
    render(<IngredientList ingredients={mockIngredients} />);

    const servingInput = screen.getByLabelText('Number of servings');
    fireEvent.change(servingInput, { target: { value: '3' } });

    expect(servingInput).toHaveValue(3);
  });

  it('should display approximate and ranged source quantities', () => {
    const sourceQuantities: Recipe['ingredients'] = [
      {
        name: 'Yellow Chartreuse',
        slug: 'yellow-chartreuse',
        type: 'liqueur',
        quantity: { amount: 0.5, modifier: 'scant', unit: 'oz' },
        categories: [],
        refs: [],
        ingredients: [],
      },
      {
        name: 'Mint leaves',
        slug: 'mint-leaves',
        type: 'other',
        quantity: { amount: 6, maximum: 8, unit: 'unit' },
        categories: [],
        refs: [],
        ingredients: [],
      },
    ];

    render(<IngredientList ingredients={sourceQuantities} />);

    const ingredientList = screen.getByRole('list');
    const modifier = screen.getByText('scant');
    const rangeSeparator = screen.getByText('to');

    expect(rangeSeparator).toHaveAttribute('class', modifier.getAttribute('class'));
    expect(ingredientList).toHaveTextContent('½');
    expect(screen.getByText('6')).toBeVisible();
    expect(rangeSeparator).toBeVisible();
    expect(screen.getByText('8')).toBeVisible();
    expect(ingredientList).toHaveTextContent('Mint leaves');
  });

  it('should scale ingredient quantities when servings change', () => {
    const fractionalIngredients: Recipe['ingredients'] = [
      {
        name: 'Test Ingredient',
        slug: 'test-ingredient',
        type: 'spirit',
        quantity: { amount: 0.75, unit: 'oz' as const },
        categories: [],
        refs: [],
        ingredients: [],
      },
    ];

    render(<IngredientList ingredients={fractionalIngredients} defaultServings={1} />);

    // Initially should show ¾ (0.75 displayed as fraction)
    expect(screen.getByText('¾')).toBeInTheDocument();

    // Change to 3 servings
    const servingInput = screen.getByLabelText('Number of servings');
    fireEvent.change(servingInput, { target: { value: '3' } });

    // Should now show 2 ¼ (0.75 * 3 = 2.25, displayed as 2 ¼)
    expect(screen.getByText('2 ¼')).toBeInTheDocument();
  });

  it('keeps counting quantities in their source unit when metric display is selected', () => {
    const ingredients: Recipe['ingredients'] = [
      {
        name: 'Angostura bitters',
        slug: 'angostura-bitters',
        type: 'bitter',
        quantity: { amount: 2, unit: 'dash' },
        categories: [],
        refs: [],
        ingredients: [],
      },
    ];

    render(<IngredientList ingredients={ingredients} />);

    fireEvent.click(screen.getByRole('button', { name: 'ml' }));

    const ingredientList = screen.getByRole('list');
    expect(ingredientList).toHaveTextContent('2 dash');
    expect(ingredientList).not.toHaveTextContent('ml');
  });

  it('keeps ordinary ingredient links free of recipe context', () => {
    render(<IngredientList ingredients={mockIngredients} />);

    expect(screen.getByRole('link', { name: /Lemon Juice/i })).toHaveAttribute(
      'href',
      '/ingredient/juice/lemon-juice',
    );
  });

  it('links techniques with the scaled quantity and unit', () => {
    const contextualIngredients: Recipe['ingredients'] = [
      {
        name: 'Lime juice',
        slug: 'lime-juice',
        type: 'juice',
        quantity: { amount: 0.75, unit: 'oz' },
        technique: [{ technique: 'clarification' }, { technique: 'acid-adjustment' }],
        categories: [],
        refs: [],
        ingredients: [],
      },
    ];

    render(<IngredientList ingredients={contextualIngredients} />);

    const initialParams = getLinkSearchParams(/acid-adjusted clarified Lime juice/i);
    expect(initialParams.getAll('technique')).toEqual([
      'clarification',
      'acid-adjustment',
    ]);
    expect(initialParams.get('amount')).toBe('0.75');
    expect(initialParams.get('unit')).toBe('oz');
    expect(initialParams.get('juiceAmount')).toBe('0.75');

    fireEvent.change(screen.getByLabelText('Number of servings'), {
      target: { value: '3' },
    });

    const scaledParams = getLinkSearchParams(/acid-adjusted clarified Lime juice/i);
    expect(scaledParams.get('amount')).toBe('2.25');
    expect(scaledParams.get('unit')).toBe('oz');
    expect(scaledParams.get('juiceAmount')).toBe('2.25');
  });

  it('keeps the technique row plain and links the calculator from the section header', () => {
    render(
      <IngredientList
        ingredients={mockIngredients}
        techniques={[
          {
            technique: 'clarification',
            method: 'milk',
            milk_type: 'Coconut milk',
            quantity: { amount: 4, unit: 'oz' },
          },
        ]}
      />,
    );

    const technique = screen.getByRole('list', { name: 'Milk clarification' });
    const techniqueDetails = within(technique).getByRole('listitem');
    expect(techniqueDetails).toHaveTextContent('4 oz Coconut milk');
    expect(within(technique).queryByRole('link')).not.toBeInTheDocument();

    const calculatorLink = screen.getByRole('link', {
      name: 'Calculate milk for a batch',
    });
    const calculatorUrl = new URL(
      calculatorLink.getAttribute('href') ?? '',
      'https://cocktail-index.test',
    );

    expect(calculatorUrl.pathname).toBe('/calculators/milk-clarification');
    expect(calculatorUrl.searchParams.get('milkType')).toBe('Coconut milk');
    // mockIngredients batch is 2 oz gin + 1 oz lemon juice = 3 oz
    expect(calculatorUrl.searchParams.get('amount')).toBe('3');
    expect(calculatorUrl.searchParams.get('unit')).toBe('oz');
    expect(calculatorUrl.searchParams.has('ratio')).toBe(false);
  });

  it('prefills the calculator with the scaled recipe size and ratio', () => {
    render(
      <IngredientList
        ingredients={mockIngredients}
        techniques={[
          {
            technique: 'clarification',
            method: 'milk',
            milk_type: 'Coconut milk',
            quantity: { amount: 0.75, unit: 'oz' },
          },
        ]}
      />,
    );

    const getCalculatorParams = () => {
      const link = screen.getByRole('link', { name: 'Calculate milk for a batch' });
      return new URL(link.getAttribute('href') ?? '', 'https://cocktail-index.test')
        .searchParams;
    };

    // 3 oz batch, 0.75 oz of milk
    expect(getCalculatorParams().get('amount')).toBe('3');
    expect(getCalculatorParams().get('ratio')).toBe('0.25');

    fireEvent.change(screen.getByLabelText('Number of servings'), {
      target: { value: '2' },
    });

    expect(getCalculatorParams().get('amount')).toBe('6');
    expect(getCalculatorParams().get('ratio')).toBe('0.25');
  });
});
