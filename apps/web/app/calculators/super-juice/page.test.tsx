import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import SuperJuiceCalculatorPage from './page';

describe('SuperJuiceCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
  });
  it('calculates the default lime batch', async () => {
    await setupApp(<SuperJuiceCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Lime peel weight' })).toHaveValue(100);
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('66');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('33');
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('1,666');
  });

  it('recalculates when the peel weight changes', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);
    const peelWeight = screen.getByRole('spinbutton', { name: 'Lime peel weight' });

    await user.clear(peelWeight);
    await user.type(peelWeight, '200');

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('132');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('66');
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('3,332');
  });

  it('shows no output for an invalid peel weight', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);
    const peelWeight = screen.getByRole('spinbutton', { name: 'Lime peel weight' });

    await user.clear(peelWeight);

    expect(peelWeight).toHaveAccessibleDescription('Must be greater than 0');
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('');
  });

  it('switches to lemon and drops the malic acid field', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Lemon' }));

    expect(screen.getByRole('spinbutton', { name: 'Lemon peel weight' })).toHaveValue(
      100,
    );
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('100');
    expect(screen.queryByRole('textbox', { name: 'Malic acid' })).not.toBeInTheDocument();
  });

  it('syncs the selected citrus to the URL', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = await setupApp(<SuperJuiceCalculatorPage />, {
      nuqsOptions: { onUrlUpdate },
    });

    await user.click(screen.getByRole('button', { name: 'Grapefruit' }));

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?citrus=grapefruit' }),
    );
  });

  it('reads the citrus from the URL', async () => {
    mockRouter.setCurrentUrl('?citrus=orange');
    await setupApp(<SuperJuiceCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Orange peel weight' })).toHaveValue(
      100,
    );
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('90');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('10');
  });

  it('falls back to lime for an unknown citrus in the URL', async () => {
    mockRouter.setCurrentUrl('?citrus=pomelo');
    await setupApp(<SuperJuiceCalculatorPage />);

    expect(screen.getByRole('spinbutton', { name: 'Lime peel weight' })).toHaveValue(100);
  });

  it('adds rounded MSG to the grapefruit batch', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Grapefruit' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('80');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('20');
    expect(screen.getByRole('textbox', { name: 'MSG' })).toHaveValue('3.3');
  });

  it('uses whole kumquats', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Kumquat' }));

    expect(screen.getByRole('spinbutton', { name: 'Kumquat weight' })).toHaveValue(100);
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('25');
    expect(screen.getByRole('textbox', { name: 'Water' })).toHaveValue('416.5');
    expect(screen.queryByRole('textbox', { name: 'Malic acid' })).not.toBeInTheDocument();
  });

  it('resets to the default batch', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);
    const peelWeight = screen.getByRole('spinbutton', { name: 'Lime peel weight' });

    await user.clear(peelWeight);
    await user.type(peelWeight, '50');
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(peelWeight).toHaveValue(100);
    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('66');
  });

  it('shows the instructions and attribution', async () => {
    await setupApp(<SuperJuiceCalculatorPage />);

    const instructions = screen.getByRole('list', { name: 'Instructions' });
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(5);
    expect(instructions).toHaveTextContent(
      'rest at room temperature for up to two hours',
    );
    expect(instructions).toHaveTextContent('strain through a cheesecloth');
  });

  it('adapts the instructions to whole-fruit kumquats', async () => {
    const { user } = await setupApp(<SuperJuiceCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Kumquat' }));

    const instructions = screen.getByRole('list', { name: 'Instructions' });
    expect(within(instructions).getAllByRole('listitem')).toHaveLength(5);
    expect(instructions).toHaveTextContent('Weigh the kumquats whole');
    expect(instructions).toHaveTextContent('Muddle the kumquats with the citric acid');
    expect(instructions).toHaveTextContent('ascorbic acid');
  });
});
