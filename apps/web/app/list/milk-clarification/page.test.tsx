import { permanentRedirect } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import LegacyMilkClarifiedRecipesPage from './page';

vi.mock('next/navigation', () => ({ permanentRedirect: vi.fn() }));

describe('LegacyMilkClarifiedRecipesPage', () => {
  it('forwards the old URL to the milk clarification calculator', () => {
    LegacyMilkClarifiedRecipesPage();

    expect(permanentRedirect).toHaveBeenLastCalledWith('/calculators/milk-clarification');
  });
});
