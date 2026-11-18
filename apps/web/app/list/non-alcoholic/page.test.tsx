import { permanentRedirect } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { getStyleRecipesUrl } from '#/modules/url';
import LegacyNonAlcoholicRecipesPage from './page';

vi.mock('next/navigation', () => ({ permanentRedirect: vi.fn() }));

describe('LegacyNonAlcoholicRecipesPage', () => {
  it('forwards the old URL to the non-alcoholic style page', () => {
    LegacyNonAlcoholicRecipesPage();

    expect(permanentRedirect).toHaveBeenLastCalledWith(
      getStyleRecipesUrl({ slug: 'non-alcoholic' }),
    );
  });
});
