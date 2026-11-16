import type { Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import { Book, Calculator, History, Podcast, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { siYoutube } from 'simple-icons';
import AppHeader from '#/components/AppHeader';
import BrandIcon from '#/components/icons/BrandIcon';
import { LinkListItem } from '#/components/LinkList';
import { ListSubheader } from '#/components/ui/list';
import {
  getAuthorListUrl,
  getBarListUrl,
  getBottleListUrl,
  getIngredientListUrl,
  getNonAlcoholicRecipeListUrl,
  getRecentlyAddedUrl,
  getRecipeListUrl,
  getSourceUrl,
} from '#/modules/url';

export const metadata: Metadata = {
  title: 'Indexotica: Tiki & Cocktails',
};

function SourceListItem({ source }: { source: Source }) {
  return (
    <LinkListItem
      key={source.name}
      href={getSourceUrl(source)}
      primary={source.name}
      tertiary={<span className="text-muted-foreground">{source.recipeAmount}</span>}
    />
  );
}

export default async function HomePage() {
  const [sources, recentlyAddedRecipes] = await Promise.all([
    getAllSources(),
    getRecentlyAddedRecipes(),
  ]);

  const {
    book: books = [],
    'youtube-channel': ytChannels = [],
    podcast: podcasts = [],
  } = Object.groupBy(sources, (source) => source.type);

  return (
    <>
      <AppHeader title="Indexotica" />
      <ul className="mt-4 py-2">
        <div className="surface">
          <LinkListItem
            href={getRecipeListUrl()}
            leading={<Search className="size-6 text-white" aria-hidden="true" />}
            primary="All Recipes"
          />
          {recentlyAddedRecipes.length > 0 && (
            <LinkListItem
              href={getRecentlyAddedUrl()}
              leading={<History className="size-6 text-white" aria-hidden="true" />}
              primary="Recently Added"
            />
          )}
        </div>
        <li>
          <ul>
            <ListSubheader>
              <span className="flex items-center gap-2">
                <Calculator className="size-6" aria-hidden="true" />
                Calculators
              </span>
            </ListSubheader>
            <div className="surface">
              <LinkListItem href="/calculators/acid-adjusting" primary="Acid Adjusting" />
              <LinkListItem
                href="/calculators/juice-clarification"
                primary="Juice Clarification"
              />
              <LinkListItem
                href="/calculators/milk-clarification"
                primary="Milk Clarification"
              />
              <LinkListItem
                href="/calculators/saline"
                primary="Saline Solution Calculator"
              />
              <LinkListItem
                href="/calculators/brix"
                primary="Sugar Adjusting (Brix calculator)"
              />
              <LinkListItem href="/calculators/super-juice" primary="Super Juice" />
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <span className="flex items-center gap-2">
                <Book className="size-6" aria-hidden="true" />
                By Books
              </span>
            </ListSubheader>
            <div className="surface">
              {books.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <span className="flex items-center gap-2">
                <BrandIcon icon={siYoutube} className="size-6" />
                By Youtube Channels
              </span>
            </ListSubheader>
            <div className="surface">
              {ytChannels.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>
              <span className="flex items-center gap-2">
                <Podcast className="size-6" aria-hidden="true" />
                By Podcasts
              </span>
            </ListSubheader>
            <div className="surface">
              {podcasts.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <ListSubheader>Other lists</ListSubheader>
            <div className="surface">
              <LinkListItem href={getAuthorListUrl()} primary="By Authors" />
              <LinkListItem href={getBarListUrl()} primary="By Bars" />
              <LinkListItem href={getIngredientListUrl()} primary="All Ingredients" />
              <LinkListItem
                href={getNonAlcoholicRecipeListUrl()}
                primary="Non-Alcoholic Recipes"
              />
              <LinkListItem href={getBottleListUrl()} primary="All Bottles" />
            </div>
          </ul>
        </li>
      </ul>
    </>
  );
}
