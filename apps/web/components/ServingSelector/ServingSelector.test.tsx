import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ServingSelector from './index';

function StatefulServingSelector({ initialServings = 2 }: { initialServings?: number }) {
  const [servings, setServings] = useState(initialServings);

  return <ServingSelector servings={servings} onChange={setServings} />;
}

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

    fireEvent.change(input, { target: { value: '0.1' } });
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
    expect(input).toHaveAttribute('min', '0.25');
    expect(input).toHaveAttribute('max', '50');
    expect(input).toHaveAttribute('step', '0.25');
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

    it.each([
      { servings: 0.5, expected: 1, label: 'fractional values' },
      { servings: 0.25, expected: 1, label: '0.25' },
    ])(
      'should jump to $expected when incrementing from $label',
      ({ servings, expected }) => {
        const onChange = vi.fn();
        render(<ServingSelector servings={servings} onChange={onChange} />);

        fireEvent.click(screen.getByLabelText('Increment'));

        expect(onChange).toHaveBeenCalledWith(expected);
      },
    );

    it('should be disabled when servings is at maximum (50)', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={50} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Increment');
      expect(incrementButton).toBeDisabled();

      // A disabled button never fires its handler.
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

    it.each([
      { servings: 1, expected: 0.5 },
      { servings: 0.5, expected: 0.25 },
    ])('should go from $servings to $expected', ({ servings, expected }) => {
      const onChange = vi.fn();
      render(<ServingSelector servings={servings} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Decrement'));

      expect(onChange).toHaveBeenCalledWith(expected);
    });

    it('should be disabled when servings is at minimum (0.25)', () => {
      const onChange = vi.fn();
      render(<ServingSelector servings={0.25} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Decrement');
      expect(decrementButton).toBeDisabled();

      // A disabled button never fires its handler.
      fireEvent.click(decrementButton);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Input blur behavior', () => {
    it('should reset to current value when invalid input is entered and field loses focus', async () => {
      const user = userEvent.setup();
      render(<StatefulServingSelector />);

      const input = screen.getByLabelText('Number of servings');

      await user.clear(input);
      await user.paste('0.1');
      await user.tab();

      // Should reset to current servings value
      expect(input).toHaveValue(2);
    });

    it('should reset to current value when value above maximum is entered and field loses focus', async () => {
      const user = userEvent.setup();
      render(<StatefulServingSelector />);

      const input = screen.getByLabelText('Number of servings');

      await user.clear(input);
      await user.paste('100');
      await user.tab();

      // Should reset to current servings value
      expect(input).toHaveValue(2);
    });
  });

  it('discards an invalid edit when servings changes externally', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ServingSelector servings={2} onChange={onChange} />);
    const input = screen.getByLabelText('Number of servings');

    await user.clear(input);
    await user.type(input, '0.1');
    expect(input).toHaveValue(0.1);

    rerender(<ServingSelector servings={3} onChange={onChange} />);

    expect(input).toHaveValue(3);
  });
});
