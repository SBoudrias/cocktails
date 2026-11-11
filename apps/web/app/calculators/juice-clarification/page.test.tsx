import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import JuiceClarificationCalculatorPage from './page';

describe('JuiceClarificationCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  it('calculates the water and agar agar required for the default juice weight', async () => {
    await setupApp(<JuiceClarificationCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(250);
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('75');
    expect(screen.getByRole('textbox', { name: 'Agar agar' })).toHaveValue('0.75');
    expect(screen.getAllByText('grams')).toHaveLength(3);
  });

  it('recalculates the ingredients when the juice weight changes', async () => {
    const { user } = await setupApp(<JuiceClarificationCalculatorPage />);
    const juiceWeight = screen.getByRole('spinbutton', { name: 'Raw juice weight' });

    await user.clear(juiceWeight);
    await user.type(juiceWeight, '100');

    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('30');
    expect(screen.getByRole('textbox', { name: 'Agar agar' })).toHaveValue('0.3');
  });

  it.each([
    ['grams', '?amount=500&unit=gram', 500],
    ['volume', '?amount=10&unit=oz', 300],
  ])('uses a contextual recipe amount in %s', async (_, url, expectedWeight) => {
    mockRouter.setCurrentUrl(url);
    await setupApp(<JuiceClarificationCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(
      expectedWeight,
    );
  });

  it('uses the minimum contextual default for smaller recipe amounts', async () => {
    mockRouter.setCurrentUrl('?amount=4&unit=oz');
    await setupApp(<JuiceClarificationCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Raw juice weight' })).toHaveValue(250);
  });

  it('does not overwrite user input when the URL changes', async () => {
    mockRouter.setCurrentUrl('?amount=500&unit=gram');
    const { user } = await setupApp(<JuiceClarificationCalculatorPage />);
    const juiceWeight = screen.getByRole('spinbutton', { name: 'Raw juice weight' });

    await user.clear(juiceWeight);
    await user.type(juiceWeight, '100');
    await mockRouter.push('?amount=750&unit=gram');

    expect(juiceWeight).toHaveValue(100);
  });

  it('does not calculate ingredients for an empty or invalid juice weight', async () => {
    const { user } = await setupApp(<JuiceClarificationCalculatorPage />);
    const juiceWeight = screen.getByRole('spinbutton', { name: 'Raw juice weight' });
    const water = screen.getByRole('textbox', { name: 'Water' });
    const agarAgar = screen.getByRole('textbox', { name: 'Agar agar' });

    await user.clear(juiceWeight);

    expect(juiceWeight).toHaveAccessibleDescription('Must be greater than 0');
    expect(water).toHaveValue('');
    expect(agarAgar).toHaveValue('');

    await user.type(juiceWeight, '-10');

    expect(juiceWeight).toHaveAccessibleDescription('Must be greater than 0');
    expect(water).toHaveValue('');
    expect(agarAgar).toHaveValue('');
  });

  it('resets the calculator to the contextual recipe default', async () => {
    mockRouter.setCurrentUrl('?amount=500&unit=gram');
    const { user } = await setupApp(<JuiceClarificationCalculatorPage />);
    const juiceWeight = screen.getByRole('spinbutton', { name: 'Raw juice weight' });

    await user.clear(juiceWeight);
    await user.type(juiceWeight, '100');
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(juiceWeight).toHaveValue(500);
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('150');
    expect(screen.getByRole('textbox', { name: 'Agar agar' })).toHaveValue('1.5');
  });

  it('shows the clarification procedure and source attribution', async () => {
    await setupApp(<JuiceClarificationCalculatorPage />);

    const instructions = screen.getByRole('list', { name: 'Instructions' });
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(7);
    expect(instructions).toHaveTextContent('let it bloom for a couple of minutes');
    expect(instructions).toHaveTextContent('lined with two coffee filters');
    expect(instructions).toHaveTextContent('without disturbing the gel raft');

    expect(screen.getByText('Juice clarification technique by Kate McGraw.'));
  });
});
