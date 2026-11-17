import type { YoutubeRef } from '@cocktails/data';
import { getRecipe } from '@cocktails/data/recipes';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAuthorRecipesUrl,
  getBarRecipesUrl,
  getMilkClarificationCalculatorUrl,
} from '#/modules/url';
import { setupApp } from '#/vitest.setup';
import RecipePage from './page';

describe('RecipePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('links author and bar attributions to their list pages', async () => {
    const recipe = await getRecipe({ type: 'book', slug: 'sippin-safari' }, 'last-rites');

    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: recipe.source.type,
          source: recipe.source.slug,
          recipe: recipe.slug,
        }),
      }),
    );

    const authorLink = screen.getByRole('link', { name: /mariano licudine/i });
    expect(authorLink).toHaveAttribute('href', getAuthorRecipesUrl('Mariano Licudine'));

    const barLink = screen.getByRole('link', { name: /mai-kai/i });
    expect(barLink).toHaveAttribute(
      'href',
      getBarRecipesUrl({ name: 'Mai-Kai', location: 'Fort Lauderdale, FL' }),
    );
    expect(barLink).toHaveTextContent('served at Mai-Kai');
    expect(barLink).toHaveTextContent('Fort Lauderdale, FL');
  });

  it('captions the preparation, ice and glassware badges', async () => {
    const recipe = await getRecipe({ type: 'book', slug: 'sippin-safari' }, 'last-rites');

    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: recipe.source.type,
          source: recipe.source.slug,
          recipe: recipe.slug,
        }),
      }),
    );

    const badges = within(
      screen.getByRole('list', { name: 'Preparation, ice and glassware' }),
    ).getAllByRole('listitem');
    expect(badges.map((badge) => badge.textContent)).toEqual([
      recipe.preparation,
      recipe.served_on,
      recipe.glassware,
    ]);
  });

  it('renders book chapter beside the page number when available', async () => {
    const bookRecipe = await getRecipe(
      { type: 'book', slug: 'smugglers-cove' },
      'jungle-bird',
    );

    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: bookRecipe.source.type,
          source: bookRecipe.source.slug,
          recipe: bookRecipe.slug,
        }),
      }),
    );

    expect(screen.getByText('The Tiki Revival · page 96')).toBeInTheDocument();
  });

  it('marks optional ingredients and preserves the marker when servings change', async () => {
    const { user } = await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: 'youtube-channel',
          source: 'anders-erickson',
          recipe: 'mantini',
        }),
      }),
    );

    const absinthe = screen.getByRole('link', {
      name: /St\. George Absinthe Verte \(optional\)/i,
    });
    const rye = screen.getByRole('link', { name: /Rittenhouse Rye/i });
    expect(absinthe).toHaveTextContent('2 dash');
    expect(rye).not.toHaveTextContent('(optional)');

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    expect(absinthe).toHaveTextContent('4 dash');
    expect(absinthe).toHaveAccessibleName(/St\. George Absinthe Verte \(optional\)/i);
    expect(rye).not.toHaveTextContent('(optional)');

    await user.click(screen.getByRole('radio', { name: 'ml' }));

    expect(absinthe).toHaveAccessibleName(/St\. George Absinthe Verte \(optional\)/i);
  });

  it('renders whole-recipe clarification in a scalable technique section', async () => {
    const clarifiedRecipe = await getRecipe(
      { type: 'youtube-channel', slug: 'truffles-on-the-rocks' },
      'clarified-new-york-sour',
    );

    const { user } = await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: clarifiedRecipe.source.type,
          source: clarifiedRecipe.source.slug,
          recipe: clarifiedRecipe.slug,
        }),
      }),
    );

    // The <main> landmark lives in the root layout now; the preparation
    // badge ('stirred') carries the same signal from the page itself.
    const badges = screen.getByRole('list', { name: 'Preparation, ice and glassware' });
    expect(badges).toHaveTextContent('stirred');
    expect(screen.queryByText('Whole milk clarified')).not.toBeInTheDocument();

    const technique = screen.getByRole('list', { name: 'Milk clarification' });
    const techniqueDetails = within(technique).getByRole('listitem');
    expect(techniqueDetails).not.toHaveTextContent('Milk clarification');
    expect(techniqueDetails).toHaveTextContent('5 oz Whole milk');
    expect(within(technique).queryByRole('link')).not.toBeInTheDocument();

    const calculatorLink = screen.getByRole('link', {
      name: 'Calculate milk for a batch',
    });
    // The action is separate from the milk quantity, not a label overriding it.
    expect(calculatorLink).toHaveTextContent(/^Calculate milk for a batch$/);
    expect(calculatorLink).not.toHaveAttribute('aria-label');
    const calculatorUrl = new URL(
      calculatorLink.getAttribute('href') ?? '',
      'https://cocktail-index.test',
    );

    expect(calculatorUrl.pathname).toBe(
      getMilkClarificationCalculatorUrl({ milkType: 'Whole milk' }).pathname,
    );
    // 19 oz batch: the floated red wine is not part of the clarified mixture
    expect([...calculatorUrl.searchParams.entries()]).toEqual([
      ['milkType', 'Whole milk'],
      ['amount', '19'],
      ['unit', 'oz'],
      ['ratio', '0.2632'],
    ]);

    await user.click(screen.getByRole('radio', { name: 'ml' }));

    expect(techniqueDetails).toHaveTextContent('150 ml Whole milk');

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    // One more serving on top of the author's 10-serving batch
    expect(techniqueDetails).toHaveTextContent('165 ml Whole milk');
    expect(calculatorLink).toHaveTextContent(/^Calculate milk for a batch$/);
  });

  it('renders the extra videos as a named carousel, one video per slide', async () => {
    // shrunken-skull: five youtube refs, the first shown in the source
    // card, so the carousel holds the remaining four. Paging — buttons,
    // arrows, indicators — is ui-sdk's carousel behavior, tested there;
    // this checks the wiring: the region, its slides, and their videos.
    const recipe = await getRecipe(
      { type: 'youtube-channel', slug: 'anders-erickson' },
      'shrunken-skull',
    );
    const videos = recipe.refs.filter((ref): ref is YoutubeRef => ref.type === 'youtube');

    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: recipe.source.type,
          source: recipe.source.slug,
          recipe: recipe.slug,
        }),
      }),
    );

    const carousel = screen.getByRole('region', { name: 'Video' });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');

    const slides = within(carousel).getAllByRole('group');
    expect(slides).toHaveLength(videos.length - 1);
    // Slides name their position and keep the embedded players, in the
    // refs' order — the same videos the old stack showed.
    slides.forEach((slide, index) => {
      expect(slide).toHaveAccessibleName(`${index + 1} of ${videos.length - 1}`);
      expect(slide.querySelector('lite-youtube')).toHaveAttribute(
        'videoid',
        videos[index + 1]!.videoId,
      );
    });

    // The controls are named buttons; with loop, neither end ever disables
    // (Next on the last wraps to the first). happy-dom's flat layout
    // measures a single page, so the wrap itself is probed on the built
    // export instead of asserted here.
    const previous = within(carousel).getByRole('button', {
      name: 'Previous video',
    });
    expect(previous).toHaveAttribute('type', 'button');
    expect(within(carousel).getByRole('button', { name: 'Next video' })).toHaveAttribute(
      'type',
      'button',
    );

    // One indicator per extra video, the first standing for the shown page.
    const indicators = within(carousel).getAllByRole('tab', { hidden: true });
    expect(indicators).toHaveLength(videos.length - 1);
    indicators.forEach((indicator, index) => {
      // aria-label, not the accessible name: slides beyond the measured
      // page (all of them under happy-dom's flat layout) carry hidden,
      // and a hidden element has no accessible name to compute.
      expect(indicator).toHaveAttribute('aria-label', `Video ${index + 1}`);
    });
    expect(indicators[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps a single extra video as a plain embed, no carousel', async () => {
    // penicillin: two youtube refs, the first in the source card, so the
    // video card holds one player and never pages.
    const recipe = await getRecipe(
      { type: 'youtube-channel', slug: 'truffles-on-the-rocks' },
      'penicillin',
    );

    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: recipe.source.type,
          source: recipe.source.slug,
          recipe: recipe.slug,
        }),
      }),
    );

    const cardTitle = screen.getByText('Video');
    expect(cardTitle).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Video' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tablist', { name: 'Choose a video' }),
    ).not.toBeInTheDocument();
  });

  it('renders the attribution list before the source card, keeping lists and cards apart', async () => {
    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: 'youtube-channel',
          source: 'educated-barfly',
          recipe: 'little-tokyo',
        }),
      }),
    );

    const attributionList = screen.getByRole('list', { name: 'Attributions' });
    const aboutCard = screen.getByRole('link', { name: /go to channel/i });

    // The list layout precedes the card flow: no jumpiness when attributions
    // render between list-styled sections and the mui cards.
    expect(
      attributionList.compareDocumentPosition(aboutCard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders website refs in an also-documented-at card', async () => {
    await setupApp(
      await RecipePage({
        params: Promise.resolve({
          type: 'youtube-channel',
          source: 'mixing-up-tiki',
          recipe: 'deep-blue-sea',
        }),
      }),
    );

    // The card names the site; the accessible name carries the full url.
    const websiteLink = screen.getByRole('link', {
      name: 'https://www.shakerofspirits.com/single-post/day-81-deep-blue-sea',
    });
    expect(websiteLink).toHaveTextContent('Shaker of Spirits');
  });
});
