import type { Recipe } from '@cocktails/data';
import { getFatWashedRecipes } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRecipeUrl } from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import FatWashCalculatorPage from './page';

vi.mock('@cocktails/data/recipes', async () => {
  const actual = await vi.importActual('@cocktails/data/recipes');
  return {
    ...actual,
    getFatWashedRecipes: vi.fn(),
  };
});

let recipeCounter = 0;

const mockRecipe = (name: string, fat = 'bacon fat'): Recipe => ({
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
      name: 'Four Roses Bourbon',
      slug: 'four-roses-bourbon',
      type: 'spirit',
      technique: { technique: 'fat-wash', fat, method: 'room-temp' },
      quantity: { amount: 2, unit: 'oz' },
      categories: [],
      refs: [],
      ingredients: [],
    },
  ],
  preparation: 'stirred',
  served_on: 'big rock',
  glassware: 'old fashioned',
  refs: [],
});

// Include Baileys so the page resolves a non-`other` fat URL from real data.
const testRecipes: Recipe[] = Array.from({ length: 24 }, (_, index) =>
  mockRecipe(
    `Fat Recipe ${String(index + 1).padStart(2, '0')}`,
    index === 1 ? 'Baileys' : 'bacon fat',
  ),
);

describe('FatWashCalculatorPage', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/calculators/fat-wash');
    recipeCounter = 0;
    vi.mocked(getFatWashedRecipes).mockResolvedValue(testRecipes);
  });

  it('starts at 750 ml with Butter (15%), renders ingredients outside the card, and omits helper notes', async () => {
    await setupApp(await FatWashCalculatorPage());

    const calculatorSection = screen.getByRole('region', { name: 'Fat quantity' });
    const spiritVolume = within(calculatorSection).getByRole('spinbutton', {
      name: 'Spirit volume',
    });
    const fatSelect = within(calculatorSection).getByRole('combobox', { name: 'Fat' });
    const percentage = within(calculatorSection).getByRole('spinbutton', {
      name: 'Fat percentage',
    });

    expect(spiritVolume).toHaveValue(750);
    expect(percentage).toHaveValue(15);
    expect(spiritVolume).not.toHaveAttribute('aria-describedby');
    expect(percentage).not.toHaveAttribute('aria-describedby');

    // Field order: Spirit volume -> Fat -> Fat percentage
    expect(
      spiritVolume.compareDocumentPosition(fatSelect) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      fatSelect.compareDocumentPosition(percentage) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Ingredient list uses the standard IngredientList outside the calculator card,
    // carrying the unit selector (not the servings selector) below the rows.
    const ingredientsSection = screen.getByRole('region', { name: 'Ingredients' });
    expect(calculatorSection).not.toContainElement(ingredientsSection);
    expect(
      within(calculatorSection).queryByRole('radiogroup', {
        name: 'Preferred measurement unit',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(ingredientsSection).getByRole('radiogroup', {
        name: 'Preferred measurement unit',
      }),
    ).toBeInTheDocument();
    expect(
      within(ingredientsSection).queryByLabelText('Number of servings'),
    ).not.toBeInTheDocument();
    const wash = within(ingredientsSection).getByRole('list', {
      name: 'Ingredients',
    });
    expect(wash).toHaveTextContent('115 ml butter');
    expect(wash).toHaveTextContent('750 ml spirit');
    expect(within(wash).getByRole('link', { name: /butter/i })).toHaveAttribute(
      'href',
      '/ingredient/other/butter',
    );
  });

  it('sorts fat dropdown options alphabetically with Other fat last', async () => {
    const { user } = await setupApp(await FatWashCalculatorPage());

    await user.click(screen.getByRole('combobox', { name: 'Fat' }));
    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent ?? '');

    expect(options).toEqual([
      'Avocado oil',
      'Bacon fat',
      'Brown butter',
      'Butter',
      'Cacao butter',
      'Coconut oil',
      'Sesame oil',
      'Other fat',
    ]);
  });

  it('recalculates when spirit volume or percentage changes', async () => {
    const { user } = await setupApp(await FatWashCalculatorPage());

    const spiritVolume = screen.getByRole('spinbutton', { name: 'Spirit volume' });
    await user.clear(spiritVolume);
    await user.type(spiritVolume, '500');
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '75 ml butter',
    );

    const percentage = screen.getByRole('spinbutton', { name: 'Fat percentage' });
    await user.clear(percentage);
    await user.type(percentage, '20');
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '100 ml butter',
    );
  });

  it('follows fat percentage defaults until edited by hand', async () => {
    const { user } = await setupApp(await FatWashCalculatorPage());
    const percentage = screen.getByRole('spinbutton', { name: 'Fat percentage' });

    await user.click(screen.getByRole('combobox', { name: 'Fat' }));
    await user.click(screen.getByRole('option', { name: 'Coconut oil' }));

    expect(percentage).toHaveValue(25);
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '190 ml coconut oil',
    );

    // Once edited by hand, switching fats keeps the user's percentage.
    await user.clear(percentage);
    await user.type(percentage, '10');

    await user.click(screen.getByRole('combobox', { name: 'Fat' }));
    await user.click(screen.getByRole('option', { name: 'Sesame oil' }));

    expect(percentage).toHaveValue(10);
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '75 ml sesame oil',
    );
  });

  it('prefills fat, percentage, method, and duration from URL params using generic spirit wording', async () => {
    mockRouter.setCurrentUrl(
      '/calculators/fat-wash?fat=bacon%20fat&method=room-temp&percentage=6&duration=240',
    );
    await setupApp(await FatWashCalculatorPage());

    expect(screen.getByRole('spinbutton', { name: 'Fat percentage' })).toHaveValue(6);
    const wash = screen.getByRole('list', { name: 'Ingredients' });
    expect(wash).toHaveTextContent('45 ml bacon fat');
    expect(wash).toHaveTextContent('750 ml spirit');

    const instructions = screen.getByRole('region', { name: 'Instructions' });
    expect(instructions).toHaveTextContent('1. Warm the bacon fat until liquid.');
    expect(instructions).toHaveTextContent(
      '2. Combine 45 ml of bacon fat with the spirit in a sealed container.',
    );
    expect(instructions).toHaveTextContent(
      '3. Infuse at room temperature for 4 hours. Stir the mixture from time to time or use a magnetic stirrer.',
    );
    expect(instructions).toHaveTextContent(
      '4. Let sit undisturbed until the fat separates, then freeze until solid.',
    );
    expect(instructions).toHaveTextContent(
      '5. Remove the solid fat cap and strain through a coffee filter.',
    );
  });

  it('keeps custom URL fats sorted alphabetically and resolves non-other fat links like Baileys', async () => {
    mockRouter.setCurrentUrl('/calculators/fat-wash?fat=Baileys&percentage=25');
    const { user } = await setupApp(await FatWashCalculatorPage());

    expect(screen.getByRole('link', { name: /Baileys/i })).toHaveAttribute(
      'href',
      '/ingredient/liqueur/baileys',
    );

    await user.click(screen.getByRole('combobox', { name: 'Fat' }));
    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent ?? '');
    expect(options.indexOf('Baileys')).toBeGreaterThan(options.indexOf('Bacon fat'));
    expect(options.indexOf('Baileys')).toBeLessThan(options.indexOf('Brown butter'));
    expect(options.at(-1)).toBe('Other fat');
  });

  it('places the Room temp / Sous-vide toggle on top of Instructions without a temperature input', async () => {
    mockRouter.setCurrentUrl(
      '/calculators/fat-wash?fat=cacao%20butter&method=sous-vide&percentage=10&duration=60&temp=65',
    );
    const { user } = await setupApp(await FatWashCalculatorPage());

    const calculatorSection = screen.getByRole('region', { name: 'Fat quantity' });
    const instructions = screen.getByRole('region', { name: 'Instructions' });

    // Method toggle sits in Instructions, not in the calculator card; no temperature input
    const methodGroup = within(instructions).getByRole('radiogroup', {
      name: 'Wash method',
    });
    expect(calculatorSection).not.toContainElement(methodGroup);
    expect(
      within(methodGroup)
        .getAllByRole('radio')
        .map((radio) => radio.textContent),
    ).toEqual(['Room temp', 'Sous-vide']);
    expect(
      within(instructions).queryByRole('spinbutton', { name: /temperature/i }),
    ).not.toBeInTheDocument();

    expect(instructions).toHaveTextContent('1. Melt the cacao butter gently.');
    expect(instructions).toHaveTextContent(
      '2. Seal 75 ml of cacao butter with the spirit in a sous-vide bag.',
    );
    expect(instructions).toHaveTextContent(
      '3. Cook sous-vide at 65°C (149°F) for 1 hour.',
    );

    await user.click(within(methodGroup).getByRole('radio', { name: 'Room temp' }));
    expect(instructions).toHaveTextContent(
      '3. Infuse at room temperature for 4 hours. Stir the mixture from time to time or use a magnetic stirrer.',
    );

    await user.click(within(methodGroup).getByRole('radio', { name: 'Sous-vide' }));
    expect(instructions).toHaveTextContent(
      '3. Cook sous-vide at 65°C (149°F), or as instructed, for 1 to 2 hours.',
    );
  });

  it('rounds converted volumes to friendly measurements when switching units', async () => {
    const { user } = await setupApp(await FatWashCalculatorPage());
    const spiritVolume = screen.getByRole('spinbutton', { name: 'Spirit volume' });

    await user.click(screen.getByRole('radio', { name: 'oz' }));

    expect(spiritVolume).toHaveValue(25);
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '3 ¾ oz butter',
    );

    await user.click(screen.getByRole('radio', { name: 'ml' }));

    expect(spiritVolume).toHaveValue(750);
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent(
      '115 ml butter',
    );
  });

  it('reports invalid inputs with validation errors only when invalid', async () => {
    const { user } = await setupApp(await FatWashCalculatorPage());

    const spiritVolume = screen.getByRole('spinbutton', { name: 'Spirit volume' });
    await user.clear(spiritVolume);
    expect(spiritVolume).toHaveAttribute('aria-invalid', 'true');
    expect(spiritVolume).toHaveAccessibleDescription('Must be greater than 0');

    const percentage = screen.getByRole('spinbutton', { name: 'Fat percentage' });
    await user.clear(percentage);
    expect(percentage).toHaveAccessibleDescription('Must be between 0 and 100');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Enter a valid spirit volume and percentage to calculate the fat to add.',
    );
  });

  it('lists fat-washed recipes below the calculator', async () => {
    await setupApp(await FatWashCalculatorPage());

    const group = screen.getByRole('group', { name: 'Fat-washed recipes' });
    expect(within(group).getAllByRole('link')).toHaveLength(3);
    expect(
      within(group).getAllByRole('link', { name: /Fat Recipe 01/i })[0],
    ).toHaveAttribute('href', getRecipeUrl(testRecipes[0]!));
    expect(
      screen.getByRole('button', { name: `See all ${testRecipes.length} recipes` }),
    ).toBeInTheDocument();
  });
});
