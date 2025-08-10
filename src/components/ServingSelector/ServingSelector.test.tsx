import { render, screen, fireEvent } from '@testing-library/react';
import ServingSelector from './index';

describe('ServingSelector', () => {
  it('should render with current servings value and call onChange', () => {
    const onChange = vi.fn();
    render(<ServingSelector servings={2} onChange={onChange} />);

    const input = screen.getByLabelText('Number of servings');
    expect(input).toHaveValue(2);

    // Test onChange functionality
    fireEvent.change(input, { target: { value: '4' } });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should validate input values', () => {
    const onChange = vi.fn();
    render(<ServingSelector servings={2} onChange={onChange} />);

    const input = screen.getByLabelText('Number of servings');

    // Should not call onChange for invalid values below minimum
    fireEvent.change(input, { target: { value: '-1' } });
    expect(onChange).not.toHaveBeenCalled();

    // Should not call onChange for invalid values above maximum
    fireEvent.change(input, { target: { value: '51' } });
    expect(onChange).not.toHaveBeenCalled();

    // Should call onChange for valid fractional values
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '0.5' } });
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('should have proper accessibility attributes', () => {
    const onChange = vi.fn();
    render(<ServingSelector servings={2} onChange={onChange} />);

    const input = screen.getByLabelText('Number of servings');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '50');
    expect(input).toHaveAttribute('type', 'number');
  });

  describe('Increment button', () => {
    it('should increment by 1 when servings is 1 or above', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={2} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('should jump to 1 when incrementing from fractional values', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.5} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should jump to 1 when incrementing from 0.25', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.25} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should be disabled when servings is at maximum (50)', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={50} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      expect(incrementButton).toBeDisabled();
    });

    it('should not increment beyond maximum', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={50} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      fireEvent.click(incrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Decrement button', () => {
    it('should decrement by 1 when servings is above 1', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={3} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('should go from 1 to 0.5', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={1} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(0.5);
    });

    it('should go from 0.5 to 0.25', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.5} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(0.25);
    });

    it('should be disabled when servings is at minimum (0.25)', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.25} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      expect(decrementButton).toBeDisabled();
    });

    it('should not decrement below minimum', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.25} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      fireEvent.click(decrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Input blur behavior', () => {
    it('should reset to current value when invalid input is entered and field loses focus', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={2} onChange={onChange} />);

      const input = screen.getByLabelText('Number of servings');

      // Enter invalid value
      fireEvent.change(input, { target: { value: '0.1' } });
      fireEvent.blur(input);

      // Should reset to current servings value
      expect(input).toHaveValue(2);
    });

    it('should reset to current value when value above maximum is entered and field loses focus', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={2} onChange={onChange} />);

      const input = screen.getByLabelText('Number of servings');

      // Enter invalid value
      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.blur(input);

      // Should reset to current servings value
      expect(input).toHaveValue(2);
    });
  });
});
