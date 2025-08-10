import { render, screen, fireEvent } from '@testing-library/react';
import ServingSelector from './index';

describe('ServingSelector', () => {
  it('should render with current servings value and call onChange', () => {
    const onChange = vi.fn();
    render(
      <ServingSelector currentServings={2} defaultServings={1} onChange={onChange} />,
    );

    const input = screen.getByLabelText('Number of servings');
    expect(input).toHaveValue(2);

    // Test onChange functionality
    fireEvent.change(input, { target: { value: '4' } });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should show recipe default when different from current', () => {
    const onChange = vi.fn();
    render(
      <ServingSelector currentServings={2} defaultServings={1} onChange={onChange} />,
    );

    expect(screen.getByText('(recipe default: 1)')).toBeInTheDocument();
  });

  it('should not show recipe default when same as current', () => {
    const onChange = vi.fn();
    render(
      <ServingSelector currentServings={1} defaultServings={1} onChange={onChange} />,
    );

    expect(screen.queryByText('(recipe default: 1)')).not.toBeInTheDocument();
  });

  it('should validate input values', () => {
    const onChange = vi.fn();
    render(
      <ServingSelector currentServings={2} defaultServings={1} onChange={onChange} />,
    );

    const input = screen.getByLabelText('Number of servings');

    // Should not call onChange for invalid values
    fireEvent.change(input, { target: { value: '0' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '51' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const onChange = vi.fn();
    render(
      <ServingSelector currentServings={2} defaultServings={1} onChange={onChange} />,
    );

    const input = screen.getByLabelText('Number of servings');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '50');
    expect(input).toHaveAttribute('type', 'number');
  });
});
