import { screen, within } from '@testing-library/react';
import { setupApp } from '#/testing';
import HomePage from './page';

describe('HomePage', () => {
  it('lists calculators alphabetically', async () => {
    setupApp(await HomePage());

    const calculators = screen.getByText('Calculators').closest('ul');
    if (calculators == null) {
      throw new Error('Expected the calculators section to be rendered');
    }

    expect(
      within(calculators)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Acid Adjusting',
      'Juice Clarification',
      'Saline Solution Calculator',
      'Sugar Adjusting (Brix calculator)',
    ]);
    expect(
      within(calculators).getByRole('link', { name: 'Juice Clarification' }),
    ).toHaveAttribute('href', '/calculators/juice-clarification');
  });
});
