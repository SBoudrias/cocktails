import { permanentRedirect } from 'next/navigation';

/**
 * The milk-clarified list moved onto the calculator's page (#639): the
 * recipes render under the calculator itself. The static export keeps the
 * old URL alive for bookmarks and search results: it bakes a page that
 * forwards to the calculator page.
 */
export default function LegacyMilkClarifiedRecipesPage() {
  permanentRedirect('/calculators/milk-clarification');
}
