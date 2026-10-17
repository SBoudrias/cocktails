import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import BarRecipesPage from './page';

describe('BarRecipesPage', () => {
  it('renders the About card with location, description, website and map links', async () => {
    setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'mai-kai-fort-lauderdale-fl' }),
      }),
    );

    expect(screen.getByText('Fort Lauderdale, FL')).toBeInTheDocument();
    expect(
      screen.getByText(/Polynesian-themed restaurant and tiki bar/i),
    ).toBeInTheDocument();

    const websiteLink = screen.getByRole('link', { name: /mai-kai\.com/i });
    expect(websiteLink).toHaveAttribute('href', 'https://mai-kai.com');

    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink.getAttribute('href')).toContain('https://www.google.com/maps/search/');
  });

  it('renders no About card for a name-only bar', async () => {
    setupApp(
      await BarRecipesPage({
        params: Promise.resolve({ name: 'trader-vics' }),
      }),
    );

    expect(screen.queryByRole('link', { name: /map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /\.com/i })).not.toBeInTheDocument();
  });
});
