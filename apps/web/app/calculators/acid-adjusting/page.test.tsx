import type { Recipe } from '@cocktails/data';
import { getAcidAdjustedRecipes } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import AcidAdjustingPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getAcidAdjustedRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string): Recipe => ({
  name,
  slug: `recipe-${++recipeCounter}`,
  source: {
    type: 'book',
    name: 'Test Source',
    slug: 'test-source',
    link: 'https://example.com',
    description: 'Test description',
    recipeAmount: 1,
  },
  attributions: [],
  ingredients: [
    {
      name: 'Lime juice',
      slug: 'lime-juice',
      type: 'juice',
      technique: { technique: 'acid-adjustment' },
      quantity: { amount: 1, unit: 'oz' },
      categories: [],
      refs: [],
      ingredients: [],
    },
  ],
  preparation: 'shaken',
  served_on: 'up',
  glassware: 'coupe',
  refs: [],
});

// The real set holds 29 recipes: the long-list shape, drawer behind a
// see-all row.
const testRecipes: Recipe[] = Array.from({ length: 29 }, (_, index) =>
  mockRecipe(`Acid Recipe ${String(index + 1).padStart(2, '0')}`),
);

describe('AcidAdjustingPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/calculators/acid-adjusting');
    recipeCounter = 0;
    vi.mocked(getAcidAdjustedRecipes).mockResolvedValue(testRecipes);
  });
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

    await user.click(within(solutionRecipe).getByRole('radio', { name: 'Lemon' }));

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

    await user.click(screen.getByRole('radio', { name: 'Powder' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('3');
    expect(screen.getByRole('textbox', { name: 'Malic acid' })).toHaveValue('2');

    await user.click(screen.getByRole('radio', { name: 'Lemon' }));

    expect(screen.getByRole('textbox', { name: 'Citric acid' })).toHaveValue('5');
    expect(screen.queryByRole('textbox', { name: 'Malic acid' })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Reset powder adjustment to defaults' }),
    );

    expect(screen.getByRole('radio', { name: 'Lemon' })).toHaveAttribute(
      'aria-checked',
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
    await user.click(screen.getByRole('radio', { name: 'Lemon' }));
    await user.click(
      screen.getByRole('button', { name: 'Reset juice adjustment to defaults' }),
    );

    expect(juiceAmount).toHaveValue(1);
    expect(bottleSize).toHaveValue(250);
    expect(screen.getByRole('radio', { name: 'Lemon' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await user.click(
      screen.getByRole('button', { name: 'Reset solution recipe to defaults' }),
    );

    expect(bottleSize).toHaveValue(100);
    expect(screen.getByRole('radio', { name: 'Lemon' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('previews the acid-adjusted recipes with a see-all row opening the drawer', async () => {
    await setupApp(await AcidAdjustingPage());

    const group = screen.getByRole('group', { name: 'Acid-adjusted recipes' });

    // The preview: the first three recipes, as plain links.
    expect(within(group).getAllByRole('link')).toHaveLength(3);

    // The see-all row names the full count.
    expect(
      screen.getByRole('button', { name: `See all ${testRecipes.length} recipes` }),
    ).toBeInTheDocument();
  });

  it('keeps the full acid-adjusted list in the closed sheet, crawlable', async () => {
    // keepMounted: the drawer's content renders while closed, so every
    // recipe link ships in the static export's HTML.
    await setupApp(await AcidAdjustingPage());

    const sheet = screen.getAllByRole('dialog', { hidden: true })[0]!;
    expect(sheet).toHaveTextContent('Acid-adjusted recipes');
    expect(within(sheet).getAllByRole('link', { hidden: true })).toHaveLength(
      testRecipes.length,
    );
  });
});
