import { render, screen, fireEvent } from '@testing-library/react';
import IngredientList from './index';
import type { Recipe } from '@/types/Recipe';

describe('IngredientList', () => {
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
});
