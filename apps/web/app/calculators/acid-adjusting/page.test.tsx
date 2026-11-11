import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { setupApp } from '#/vitest.setup';
import AcidAdjustingPage from './page';

describe('AcidAdjustingPage', () => {
  it('reads and updates the juice amount URL parameter', async () => {
    mockRouter.setCurrentUrl('?juiceAmount=2');
    const onUrlUpdate = vi.fn();
    const { user } = await setupApp(await AcidAdjustingPage(), {
      nuqsOptions: { onUrlUpdate },
    });

    const juiceAmount = screen.getByRole('spinbutton', { name: 'Juice amount' });
    expect(juiceAmount).toHaveValue(2);

    await user.clear(juiceAmount);
    await user.type(juiceAmount, '3');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?juiceAmount=3' }),
    );
  });

  it('calculates solution dosing and a scalable Lime solution recipe', async () => {
    const { user } = await setupApp(await AcidAdjustingPage());

    expect(screen.getByRole('textbox', { name: 'Acid solution to add' })).toHaveValue(
      '5',
    );
    expect(screen.getByRole('textbox', { name: 'Citric acid for solution' })).toHaveValue(
      '24',
    );
    expect(screen.getByRole('textbox', { name: 'Malic acid for solution' })).toHaveValue(
      '11',
    );
    expect(screen.getByRole('textbox', { name: 'Approximate water' })).toHaveValue('78');
    expect(screen.queryByText('Final solution volume')).not.toBeInTheDocument();

    const bottleSize = screen.getByRole('spinbutton', { name: 'Bottle size' });
    await user.clear(bottleSize);
    await user.type(bottleSize, '250');

    expect(screen.getByRole('textbox', { name: 'Citric acid for solution' })).toHaveValue(
      '60',
    );
    expect(screen.getByRole('textbox', { name: 'Malic acid for solution' })).toHaveValue(
      '27.5',
    );
    expect(screen.getByRole('textbox', { name: 'Approximate water' })).toHaveValue('195');
    expect(screen.getByText(/reach 250 ml total volume/i)).toBeInTheDocument();
  });

  it('scales the Lemon solution recipe without estimating water weight', async () => {
    const { user } = await setupApp(await AcidAdjustingPage());
    const solutionRecipe = screen.getByRole('region', { name: 'Make the solution' });

    await user.click(within(solutionRecipe).getByRole('button', { name: 'Lemon' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid for solution' })).toHaveValue(
      '35',
    );
    expect(
      screen.queryByRole('textbox', { name: 'Malic acid for solution' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Approximate water' }),
    ).not.toBeInTheDocument();
  });

  it('calculates direct powder adjustments for Lime and Lemon profiles', async () => {
    const { user } = await setupApp(await AcidAdjustingPage());

    await user.click(screen.getByRole('button', { name: 'Powder' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('3');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('2');

    await user.click(screen.getByRole('button', { name: 'Lemon' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('5');
    expect(screen.queryByRole('textbox', { name: 'Malic acid' })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Reset powder adjustment to defaults' }),
    );

    expect(screen.getByRole('button', { name: 'Lemon' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not recommend removing solution when target acidity is too low', async () => {
    const { user } = await setupApp(await AcidAdjustingPage());
    const targetAcidity = screen.getByRole('spinbutton', { name: 'Target acidity' });

    await user.clear(targetAcidity);
    await user.type(targetAcidity, '1');

    expect(screen.getByRole('textbox', { name: 'Acid solution to add' })).toHaveValue('');
    expect(screen.getByText('Must be greater than juice acidity')).toBeInTheDocument();
  });

  it('resets the adjustment and solution recipe independently without changing the profile', async () => {
    const { user } = await setupApp(await AcidAdjustingPage());
    const juiceAmount = screen.getByRole('spinbutton', { name: 'Juice amount' });
    const bottleSize = screen.getByRole('spinbutton', { name: 'Bottle size' });

    await user.clear(juiceAmount);
    await user.type(juiceAmount, '2');
    await user.clear(bottleSize);
    await user.type(bottleSize, '250');
    await user.click(screen.getByRole('button', { name: 'Lemon' }));
    await user.click(
      screen.getByRole('button', { name: 'Reset juice adjustment to defaults' }),
    );

    expect(juiceAmount).toHaveValue(1);
    expect(bottleSize).toHaveValue(250);
    expect(screen.getByRole('button', { name: 'Lemon' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(
      screen.getByRole('button', { name: 'Reset solution recipe to defaults' }),
    );

    expect(bottleSize).toHaveValue(100);
    expect(screen.getByRole('button', { name: 'Lemon' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
