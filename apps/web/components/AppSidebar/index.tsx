'use client';

import type { Category, Source } from '@cocktails/data';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import SearchInput from '#/components/SearchInput';
import {
  getAuthorListUrl,
  getBarListUrl,
  getBottleListUrl,
  getCategoryUrl,
  getIngredientListUrl,
  getMilkClarifiedRecipeListUrl,
  getNonAlcoholicRecipeListUrl,
  getRecentlyAddedUrl,
  getRecipeListUrl,
  getSourceNavUrl,
} from '#/modules/url';

export type SidebarCategory = {
  slug: string;
  name: string;
  categoryType?: Category['categoryType'];
};

export type SidebarSource = {
  slug: string;
  name: string;
  type: Source['type'];
};

const CATEGORY_GROUPS = [
  { type: 'spirit', label: 'Spirits' },
  { type: 'liqueur', label: 'Liqueurs' },
  { type: 'wine', label: 'Wines' },
  { type: 'beer', label: 'Beers' },
  { type: 'bitter', label: 'Bitters' },
  { type: 'syrup', label: 'Syrups' },
  { type: 'soda', label: 'Sodas' },
  { type: 'other', label: 'Other' },
] as const;

const SOURCE_GROUPS = [
  { type: 'book', label: 'Books' },
  { type: 'youtube-channel', label: 'YouTube Channels' },
  { type: 'podcast', label: 'Podcasts' },
] as const;

const CALCULATORS: [Route, string][] = [
  ['/calculators/acid-adjusting', 'Acid Adjusting'],
  ['/calculators/brix', 'Brix / Sugar Adjusting'],
  ['/calculators/juice-clarification', 'Juice Clarification'],
  ['/calculators/milk-clarification', 'Milk Clarification'],
  ['/calculators/saline', 'Saline Solution'],
];

function NavLink<const RouteType extends string>({
  href,
  primary,
}: {
  href: Route<RouteType>;
  primary: string;
}) {
  const pathname = usePathname();
  return (
    <ListItemButton href={href} dense selected={pathname === href}>
      <ListItemText primary={primary} slotProps={{ primary: { noWrap: true } }} />
    </ListItemButton>
  );
}

function CollapseGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton dense onClick={() => setOpen(!open)}>
        <ListItemText primary={label} slotProps={{ primary: { noWrap: true } }} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>{children}</List>
      </Collapse>
    </>
  );
}

export default function AppSidebar({
  categories,
  sources,
}: {
  categories: SidebarCategory[];
  sources: SidebarSource[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const categoriesByLabel = Object.groupBy(
    categories,
    (category) =>
      CATEGORY_GROUPS.find(({ type }) => type === category.categoryType)?.label ??
      'Other',
  );
  const sourcesByType = Object.groupBy(sources, (source) => source.type);

  return (
    <Box
      component="nav"
      aria-label="Site sections"
      sx={{
        width: 272,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        position: 'sticky',
        top: 64,
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        pb: 2,
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <SearchInput
          placeholder="Search recipes…"
          value={search}
          onChangeAction={(value) => setSearch(value ?? '')}
          onSubmitAction={(value) => {
            if (value.trim() !== '') {
              const url: Route = `/list/recipes?search=${encodeURIComponent(value)}`;
              router.push(url);
            }
          }}
        />
      </Box>
      <List dense>
        <ListSubheader>Browse</ListSubheader>
        <li>
          <ul>
            <NavLink href={getRecipeListUrl()} primary="All Recipes" />
            <NavLink href={getRecentlyAddedUrl()} primary="Recently Added" />
            <NavLink href={getNonAlcoholicRecipeListUrl()} primary="Non-Alcoholic" />
            <NavLink href={getMilkClarifiedRecipeListUrl()} primary="Milk-Clarified" />
          </ul>
        </li>

        <li>
          <ul>
            <ListSubheader>Categories</ListSubheader>
            {CATEGORY_GROUPS.filter(({ label }) => categoriesByLabel[label]?.length).map(
              ({ label }) => (
                <CollapseGroup
                  key={label}
                  label={`${label} (${categoriesByLabel[label]?.length})`}
                >
                  {categoriesByLabel[label]
                    ?.toSorted((a, b) => a.name.localeCompare(b.name))
                    .map((category) => (
                      <NavLink
                        href={getCategoryUrl(category)}
                        key={category.slug}
                        primary={category.name}
                      />
                    ))}
                </CollapseGroup>
              ),
            )}
          </ul>
        </li>

        <li>
          <ul>
            <ListSubheader>Sources</ListSubheader>
            {SOURCE_GROUPS.filter(({ type }) => sourcesByType[type]?.length).map(
              ({ type, label }) => (
                <CollapseGroup
                  key={type}
                  label={`${label} (${sourcesByType[type]?.length})`}
                >
                  {sourcesByType[type]
                    ?.toSorted((a, b) => a.name.localeCompare(b.name))
                    .map((source) => (
                      <NavLink
                        href={getSourceNavUrl(source)}
                        key={source.slug}
                        primary={source.name}
                      />
                    ))}
                </CollapseGroup>
              ),
            )}
          </ul>
        </li>

        <li>
          <ul>
            <ListSubheader>Calculators</ListSubheader>
            {CALCULATORS.map(([href, label]) => (
              <NavLink href={href} key={href} primary={label} />
            ))}
          </ul>
        </li>

        <li>
          <ul>
            <ListSubheader>Lists</ListSubheader>
            <NavLink href={getAuthorListUrl()} primary="By Authors" />
            <NavLink href={getBarListUrl()} primary="By Bars" />
            <NavLink href={getIngredientListUrl()} primary="All Ingredients" />
            <NavLink href={getBottleListUrl()} primary="All Bottles" />
          </ul>
        </li>
      </List>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
