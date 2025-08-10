import { render, screen, fireEvent } from '@testing-library/react';
import IngredientList from './index';
import { Recipe } from '@/types/Recipe';

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
});
