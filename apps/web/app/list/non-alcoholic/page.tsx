import { permanentRedirect } from 'next/navigation';
import { getStyleRecipesUrl } from '#/modules/url';

/**
 * The non-alcoholic list moved under the styles. The static export keeps
 * the old URL alive for bookmarks and search results: it bakes a page that
 * forwards to the style page.
 */
export default function LegacyNonAlcoholicRecipesPage() {
  permanentRedirect(getStyleRecipesUrl({ slug: 'non-alcoholic' }));
}
