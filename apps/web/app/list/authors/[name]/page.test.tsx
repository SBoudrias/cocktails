import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setupApp } from '#/vitest.setup';
import AuthorRecipesPage from './page';

describe('AuthorRecipesPage', () => {
  it('renders the About card with link and description for a verified author', async () => {
    setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'brian-maxwell' }),
      }),
    );

    // The About card's header is the page's title — the name shows once.
    expect(screen.getAllByText('Brian Maxwell')).toHaveLength(1);
    // The recipe list carries the author's name, without duplication of the card's content.
    expect(screen.getByText('Recipes by Brian Maxwell')).toBeInTheDocument();
    expect(screen.getByText('Tiki blogger behind Shaker of Spirits')).toBeInTheDocument();

    const websiteLink = screen.getByRole('link', { name: /shakerofspirits\.com/i });
    expect(websiteLink).toHaveAttribute('href', 'https://shakerofspirits.com');
  });

  it('renders the card header for a name-only author, without extra links', async () => {
    setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'aj-stocak' }),
      }),
    );

    expect(screen.getAllByText('AJ Stocak')).toHaveLength(1);
    // Name-only entities have no external links on their page.
    expect(screen.queryByRole('link', { name: /\.com/i })).not.toBeInTheDocument();
  });

  it("links the author's known-for bars and the sources behind them", async () => {
    setupApp(
      await AuthorRecipesPage({
        params: Promise.resolve({ name: 'anders-erickson' }),
      }),
    );

    const channelLink = screen.getByRole('link', { name: 'Anders Erickson' });
    expect(channelLink).toHaveAttribute(
      'href',
      '/source/youtube-channel/anders-erickson',
    );

    // The bars/sources lines interleave text and links, so match on the
    // typography element that carries exactly the full line.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element?.textContent === 'Behind Anders Erickson',
      ),
    ).toBeInTheDocument();
  });
});
