import type { Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import { getRecipeStyles, getRecipesByStyle } from '@cocktails/data/styles';
import { Book, Calculator, History, Podcast, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { siYoutube } from 'simple-icons';
import AppHeader from '#/components/AppHeader';
import BrandIcon from '#/components/icons/BrandIcon';
import { LinkListItem } from '#/components/list/LinkList';
import { List, ListSubheader } from '#/components/ui/list';
import {
  getAuthorListUrl,
  getBarListUrl,
  getBottleListUrl,
  getIngredientListUrl,
  getNonAlcoholicRecipeListUrl,
  getRecentlyAddedUrl,
  getRecipeListUrl,
  getSourceUrl,
  getStyleRecipesUrl,
} from '#/modules/url';

export const metadata: Metadata = {
  title: 'Indexotica: Tiki & Cocktails',
};

// A home section: an icon- and title-bearing subheader over a surface block
// of rows. LinkList can't draw this — its header is a plain string and its
// rows sit in a surface block — so the scaffold gets a page-local helper.
function HomeSection({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <ul>
        <ListSubheader>
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        </ListSubheader>
        <div className="surface">{children}</div>
      </ul>
    </li>
  );
}

function SourceListItem({ source }: { source: Source }) {
  return (
    <LinkListItem
      href={getSourceUrl(source)}
      primary={source.name}
      count={source.recipeAmount}
    />
  );
}

export default async function HomePage() {
  const [sources, recentlyAddedRecipes, stylePages] = await Promise.all([
    getAllSources(),
    getRecentlyAddedRecipes(),
    Promise.all(
      getRecipeStyles().map(async (style) => ({
        style,
        // A style nothing in the corpus matches links nowhere.
        recipeCount: (await getRecipesByStyle(style.slug)).length,
      })),
    ),
  ]);

  const {
    book: books = [],
    'youtube-channel': ytChannels = [],
    podcast: podcasts = [],
  } = Object.groupBy(sources, (source) => source.type);

  return (
    <>
      <AppHeader title="Indexotica" />
      <List className="mt-4 py-2">
        <div className="surface">
          <LinkListItem
            href={getRecipeListUrl()}
            leading={<Search className="size-6 text-foreground" />}
            primary="All Recipes"
          />
          {recentlyAddedRecipes.length > 0 && (
            <LinkListItem
              href={getRecentlyAddedUrl()}
              leading={<History className="size-6 text-foreground" />}
              primary="Recently Added"
            />
          )}
        </div>
        <HomeSection icon={<Calculator className="size-6" />} title="Calculators">
          <LinkListItem href="/calculators/acid-adjusting" primary="Acid Adjusting" />
          <LinkListItem
            href="/calculators/juice-clarification"
            primary="Juice Clarification"
          />
          <LinkListItem
            href="/calculators/milk-clarification"
            primary="Milk Clarification"
          />
          <LinkListItem href="/calculators/saline" primary="Saline Solution Calculator" />
          <LinkListItem
            href="/calculators/brix"
            primary="Sugar Adjusting (Brix calculator)"
          />
          <LinkListItem href="/calculators/super-juice" primary="Super Juice" />
        </HomeSection>
        {stylePages.some(({ recipeCount }) => recipeCount > 0) && (
          <HomeSection title="By style">
            {stylePages
              .filter(({ recipeCount }) => recipeCount > 0)
              .map(({ style, recipeCount }) => (
                <LinkListItem
                  key={style.slug}
                  href={getStyleRecipesUrl(style)}
                  primary={style.name}
                  count={recipeCount}
                />
              ))}
          </HomeSection>
        )}
        <HomeSection icon={<Book className="size-6" />} title="By Books">
          {books.map((source) => (
            <SourceListItem source={source} key={source.name} />
          ))}
        </HomeSection>
        <HomeSection
          icon={<BrandIcon icon={siYoutube} size="lg" />}
          title="By Youtube Channels"
        >
          {ytChannels.map((source) => (
            <SourceListItem source={source} key={source.name} />
          ))}
        </HomeSection>
        <HomeSection icon={<Podcast className="size-6" />} title="By Podcasts">
          {podcasts.map((source) => (
            <SourceListItem source={source} key={source.name} />
          ))}
        </HomeSection>
        <HomeSection title="Other lists">
          <LinkListItem href={getAuthorListUrl()} primary="By Authors" />
          <LinkListItem href={getBarListUrl()} primary="By Bars" />
          <LinkListItem href={getIngredientListUrl()} primary="All Ingredients" />
          <LinkListItem
            href={getNonAlcoholicRecipeListUrl()}
            primary="Non-Alcoholic Recipes"
          />
          <LinkListItem href={getBottleListUrl()} primary="All Bottles" />
        </HomeSection>
      </List>
    </>
  );
}
