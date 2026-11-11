import { screen } from '@testing-library/react';
import { setupApp } from '#/vitest.setup';
import BrixCalculatorPage from './page';

describe('Sugar adjusting calculator', () => {
  it('defaults to 100 grams of juice and restores it on reset', async () => {
    const { user } = await setupApp(<BrixCalculatorPage />);
    const juiceWeight = screen.getByRole('spinbutton', { name: 'Juice weight' });

    expect(juiceWeight).toHaveValue(100);
    expect(screen.getByRole('textbox', { name: 'Sugar to add' })).toHaveValue('100');

    await user.clear(juiceWeight);
    await user.type(juiceWeight, '250');
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(juiceWeight).toHaveValue(100);
  });
});
