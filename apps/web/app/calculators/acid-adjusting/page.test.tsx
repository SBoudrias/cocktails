import { screen } from '@testing-library/react';
import { setupApp } from '#/testing';
import AcidAdjustingPage from './page';

describe('AcidAdjustingPage', () => {
  it('reads and updates the juice amount URL parameter', async () => {
    const onUrlUpdate = vi.fn();
    const { user } = setupApp(await AcidAdjustingPage(), {
      nuqsOptions: {
        searchParams: '?juiceAmount=2',
        onUrlUpdate,
      },
    });

    const juiceAmount = screen.getByRole('spinbutton', { name: 'Juice amount' });
    expect(juiceAmount).toHaveValue(2);

    await user.clear(juiceAmount);
    await user.type(juiceAmount, '3');

    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?juiceAmount=3' }),
    );
  });
});
