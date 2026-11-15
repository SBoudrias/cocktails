import type { Source } from '@cocktails/data';
import { getRecentlyAddedRecipes } from '@cocktails/data/recipes';
import { getAllSources } from '@cocktails/data/sources';
import {
  BookOpen,
  Calculator,
  ChevronRight,
  History,
  Martini,
  Mic,
  Search,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '#/components/AppHeader';
import YoutubeIcon from '#/components/icons/YoutubeIcon';
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

// MUI metrics verbatim: the subheader with its icon row, and the rows with
// the chevron the secondaryAction drew.
// The subheader row, with the section's leading icon: ui/list's
// ListSubheader metrics + the icon the MUI Stack row carried.
function SectionSubheader({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ListSubheader className="flex items-center gap-2">
      {icon}
      {children}
    </ListSubheader>
  );
}

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
        <li>
          <div className="bg-card">
            <LinkListItem
              href={getRecipeListUrl()}
              primary="All Recipes"
              leading={<Search aria-hidden="true" className="size-6" />}
            />
            {recentlyAddedRecipes.length > 0 && (
              <LinkListItem
                href={getRecentlyAddedUrl()}
                primary="Recently Added"
                leading={<History aria-hidden="true" className="size-6" />}
              />
            )}
          </div>
        </li>
        <li>
          <ul>
            <SectionSubheader>
              <Calculator aria-hidden="true" className="size-6" />
              Calculators
            </SectionSubheader>
            <div className="bg-card">
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
            <SectionSubheader>
              <BookOpen aria-hidden="true" className="size-6" />
              By Books
            </SectionSubheader>
            <div className="bg-card">
              {books.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <SectionSubheader>
              <YoutubeIcon />
              By Youtube Channels
            </SectionSubheader>
            <div className="bg-card">
              {ytChannels.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <SectionSubheader>
              <Mic aria-hidden="true" className="size-6" />
              By Podcasts
            </SectionSubheader>
            <div className="bg-card">
              {podcasts.map((source) => (
                <SourceListItem source={source} key={source.name} />
              ))}
            </div>
          </ul>
        </li>
        <li>
          <ul>
            <SectionSubheader>Other lists</SectionSubheader>
            <div className="bg-card">
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
