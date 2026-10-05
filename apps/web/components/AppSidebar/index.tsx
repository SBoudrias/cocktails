'use client';

import type { Category, Source } from '@cocktails/data';
import { ArrowForward, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState } from 'react';
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
  getRecipeSearchUrl,
  getSourceNavUrl,
} from '#/modules/url';

export type SidebarCategory = {
  slug: string;
  name: string;
  parents: string[];
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
  ['/calculators/juice-clarification', 'Juice Clarification'],
  ['/calculators/milk-clarification', 'Milk Clarification'],
  ['/calculators/saline', 'Saline Solution Calculator'],
  ['/calculators/brix', 'Sugar Adjusting (Brix Calculator)'],
];

function NavLink<const RouteType extends string>({
  href,
  primary,
  depth = 0,
}: {
  href: Route<RouteType>;
  primary: string;
  depth?: number;
}) {
  const selected = usePathname() === href;
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <ListItemButton
        href={href}
        dense
        selected={selected}
        aria-current={selected ? 'page' : undefined}
        sx={{ pl: 2 + depth * 2 }}
      >
        <ListItemText primary={primary} sx={{ my: 0.5 }} />
      </ListItemButton>
    </Box>
  );
}

function CollapseGroup({
  id,
  label,
  active = false,
  depth = 0,
  children,
}: {
  id: string;
  label: string;
  active?: boolean;
  depth?: number;
  children: React.ReactNode;
}) {
  // A route change reopens the active branch, including navigation through
  // page links or Back. Within a route the user can still close it.
  const pathname = usePathname();
  const [disclosure, setDisclosure] = useState({ pathname, open: active });
  if (disclosure.pathname !== pathname) {
    setDisclosure({ pathname, open: active || disclosure.open });
  }
  const open =
    disclosure.pathname === pathname ? disclosure.open : active || disclosure.open;
  const panelId = `sidebar-group-${id}`;

  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <ListItemButton
        component="button"
        dense
        aria-expanded={open}
        aria-controls={panelId}
        selected={active}
        onClick={() => setDisclosure({ pathname, open: !open })}
        sx={{ width: '100%', pl: 2 + depth * 2, textAlign: 'left' }}
      >
        <ListItemText primary={label} sx={{ my: 0.75 }} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      {/* Keep the controlled panel in the DOM even when its links unmount. */}
      <Box id={panelId}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>{children}</List>
        </Collapse>
      </Box>
    </Box>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const inputId = useId();

  return (
    <Box
      component="form"
      role="search"
      aria-label="Search all recipes"
      onSubmit={(event) => {
        event.preventDefault();
        const term = draft.trim();
        if (term !== '') {
          router.push(getRecipeSearchUrl(term));
          setDraft('');
        }
      }}
      sx={{ px: 2, pt: 2, pb: 1 }}
    >
      <Typography component="label" htmlFor={inputId} variant="body2">
        Search all recipes
      </Typography>
      <Box
        sx={{
          display: 'flex',
          mt: 1,
          borderRadius: 1,
          bgcolor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        <InputBase
          id={inputId}
          type="search"
          placeholder="Name or ingredient…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          sx={{ minWidth: 0, flex: 1, px: 1.5 }}
        />
        <IconButton type="submit" aria-label="Submit global search">
          <ArrowForward fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Enter to search the whole index
      </Typography>
    </Box>
  );
}

export default function AppSidebar({
  categories,
  sources,
}: {
  categories: SidebarCategory[];
  sources: SidebarSource[];
}) {
  const pathname = usePathname();
  const activeCategory = categories.find(
    (category) => getCategoryUrl(category) === pathname,
  );
  // Root categories plus the current subtype: deep links get the same context
  // without adding every subtype to the navigation catalogue.
  const categoriesByLabel = Object.groupBy(
    categories.filter(
      (category) => category.parents.length === 0 || category === activeCategory,
    ),
    (category) =>
      CATEGORY_GROUPS.find(({ type }) => type === category.categoryType)?.label ??
      'Other',
  );
  const sourcesByType = Object.groupBy(sources, (source) => source.type);
  const activeCategoryLabel = CATEGORY_GROUPS.find(({ label }) =>
    categoriesByLabel[label]?.some((category) => getCategoryUrl(category) === pathname),
  )?.label;
  const activeSourceType = SOURCE_GROUPS.find(({ type }) =>
    sourcesByType[type]?.some((source) => getSourceNavUrl(source) === pathname),
  )?.type;

  return (
    <Box
      component="nav"
      aria-label="Site sections"
      sx={{
        width: 272,
        flexShrink: 0,
        alignSelf: 'flex-start',
        display: { xs: 'none', md: 'block' },
        position: 'sticky',
        top: 64,
        maxHeight: 'calc(100dvh - 64px)',
        overflowY: 'auto',
        overscrollBehaviorY: 'contain',
        pb: 2,
      }}
    >
      {/* The all-recipes page already has the global URL-backed search.
          One editable input and one Clear are enough. */}
      {pathname !== getRecipeListUrl() && <GlobalSearch />}
      <List dense aria-label="Browse the index">
        <ListSubheader disableSticky>Browse</ListSubheader>
        <NavLink href={getRecipeListUrl()} primary="All Recipes" />
        <NavLink href={getRecentlyAddedUrl()} primary="Recently Added" />
        <NavLink href={getNonAlcoholicRecipeListUrl()} primary="Non-Alcoholic" />
        <NavLink href={getMilkClarifiedRecipeListUrl()} primary="Milk-Clarified" />
        <Divider component="li" sx={{ my: 1 }} />

        <CollapseGroup
          id="calculators"
          label="Calculators"
          active={pathname.startsWith('/calculators/')}
        >
          {CALCULATORS.map(([href, label]) => (
            <NavLink href={href} key={href} primary={label} depth={1} />
          ))}
        </CollapseGroup>
        <CollapseGroup id="sources" label="Sources" active={activeSourceType != null}>
          {SOURCE_GROUPS.filter(({ type }) => sourcesByType[type]?.length).map(
            ({ type, label }) => (
              <CollapseGroup
                key={type}
                id={type}
                depth={1}
                active={type === activeSourceType}
                label={`${label} (${sourcesByType[type]?.length})`}
              >
                {sourcesByType[type]
                  ?.toSorted((a, b) => a.name.localeCompare(b.name))
                  .map((source) => (
                    <NavLink
                      href={getSourceNavUrl(source)}
                      key={source.slug}
                      primary={source.name}
                      depth={2}
                    />
                  ))}
              </CollapseGroup>
            ),
          )}
        </CollapseGroup>
        <CollapseGroup id="categories" label="Categories" active={activeCategory != null}>
          {CATEGORY_GROUPS.filter(({ label }) => categoriesByLabel[label]?.length).map(
            ({ label }) => (
              <CollapseGroup
                key={label}
                id={label}
                depth={1}
                active={label === activeCategoryLabel}
                label={`${label} (${categoriesByLabel[label]?.length})`}
              >
                {categoriesByLabel[label]
                  ?.toSorted((a, b) => a.name.localeCompare(b.name))
                  .map((category) => (
                    <NavLink
                      href={getCategoryUrl(category)}
                      key={category.slug}
                      primary={category.name}
                      depth={2}
                    />
                  ))}
              </CollapseGroup>
            ),
          )}
        </CollapseGroup>
        <CollapseGroup
          id="lists"
          label="Lists"
          active={[
            '/list/authors',
            '/list/bars',
            '/list/ingredients',
            '/list/bottles',
          ].some((href) => pathname === href || pathname.startsWith(`${href}/`))}
        >
          <NavLink href={getAuthorListUrl()} primary="By Authors" depth={1} />
          <NavLink href={getBarListUrl()} primary="By Bars" depth={1} />
          <NavLink href={getIngredientListUrl()} primary="All Ingredients" depth={1} />
          <NavLink href={getBottleListUrl()} primary="All Bottles" depth={1} />
        </CollapseGroup>
      </List>
    </Box>
  );
}
