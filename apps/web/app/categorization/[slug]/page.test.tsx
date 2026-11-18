import type { RootIngredient } from '@cocktails/data';
import type * as CategorizationSystemsModule from '@cocktails/data/categorization-systems';
import { getIngredientsForCategory } from '@cocktails/data/ingredients';
import type * as IngredientsModule from '@cocktails/data/ingredients';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { setupApp } from '#/vitest.setup';
import CategorizationSystemPage from './page';

// Only the system list is faked: getCategory still resolves the real system
// nodes through the module's own loaders.
vi.mock('@cocktails/data/categorization-systems', async (importOriginal) => ({
  ...(await importOriginal<typeof CategorizationSystemsModule>()),
  getCategorizationSystems: vi.fn().mockResolvedValue([
    {
      name: 'Minimalist Tiki',
      slug: 'minimalist-tiki',
      description: 'The six Golden Era styles.',
      nodes: [
        { name: 'Aged Jamaican rum', slug: 'aged-jamaican-rum' },
        { name: 'Aged Demerara rum', slug: 'aged-demerara-rum' },
      ],
    },
  ]),
}));

vi.mock('@cocktails/data/ingredients', async (importOriginal) => ({
  ...(await importOriginal<typeof IngredientsModule>()),
  getIngredientsForCategory: vi.fn(),
}));

// The page is called at module level (below), so the member-count mock
// needs its implementation before that call — not in a beforeEach.
const member = (slug: string) => ({ slug }) as RootIngredient;
vi.mocked(getIngredientsForCategory).mockImplementation(async (category) =>
  category.slug === 'aged-jamaican-rum' ? [member('a'), member('b')] : [member('c')],
);

// Cache the page JSX once: the page is an async server component, so it is
// called and awaited — raw JSX of an async component cannot render.
const systemPage = await CategorizationSystemPage({
  params: Promise.resolve({ slug: 'minimalist-tiki' }),
});

describe('CategorizationSystemPage', () => {
  it('lists the system nodes with member counts, busiest first', async () => {
    const { container } = await setupApp(systemPage);
    await vi.waitFor(() => {
      expect(container.querySelector('[data-loading]')).toBeNull();
    });

    const list = screen.getByRole('list');
    expect(within(list).getByRole('link', { name: /Aged Jamaican rum/ })).toHaveAttribute(
      'href',
      '/category/aged-jamaican-rum',
    );

    // Two members shown next to the Jamaican style, one next to Demerara,
    // and the Jamaican style leads as the busier node. The group header is
    // also a listitem, so order is asserted on the member links.
    const links = within(list).getAllByRole('link');
    expect(links[0]).toHaveTextContent('Aged Jamaican rum2');
    expect(links[1]).toHaveTextContent('Aged Demerara rum1');
  });

  it('shows the system description', async () => {
    await setupApp(systemPage);

    expect(screen.getByText('The six Golden Era styles.')).toBeInTheDocument();
  });
});
