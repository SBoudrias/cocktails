import { screen } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { setupApp } from '#/vitest.setup';
import SearchAllLink from './index';

describe('SearchAllLink', () => {
  it('renders link with correct href including search term', async () => {
    await setupApp(<SearchAllLink searchTerm="mai tai" />);

    const link = screen.getByRole('link', { name: /search all recipes/i });
    expect(link).toHaveAttribute('href', '/search?search=mai+tai');
  });

  it.each([
    { searchTerm: null, reason: 'null' },
    { searchTerm: '', reason: 'an empty string' },
    { searchTerm: '   ', reason: 'whitespace only' },
  ])('does not render when searchTerm is $reason', async ({ searchTerm }) => {
    const { container } = await setupApp(<SearchAllLink searchTerm={searchTerm} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays helpful text for users', async () => {
    await setupApp(<SearchAllLink searchTerm="test" />);

    expect(
      screen.getByRole('link', { name: /not finding what you're looking for/i }),
    ).toBeInTheDocument();
  });

  it('reads the ?search URL parameter when no term is passed', async () => {
    mockRouter.setCurrentUrl('/?search=mai+tai');
    await setupApp(<SearchAllLink />);

    const link = screen.getByRole('link', { name: /search all recipes/i });
    expect(link).toHaveAttribute('href', '/search?search=mai+tai');
  });

  it('renders nothing without a term when none is passed', async () => {
    const { container } = await setupApp(<SearchAllLink />);
    expect(container).toBeEmptyDOMElement();
  });
});
