import { useId } from 'react';
import RecipeLinkListItem from '#/components/list/RecipeLinkListItem';
import ListDrawer from '#/components/ListDrawer';
import { List, ListSubheader } from '#/components/ui/list';
import type { RecipeListItem } from '#/modules/recipeListItem';

/**
 * The recipes that use a calculator's technique, on the calculator's own
 * page — the acid-adjusted list, the milk-clarified list. The same two
 * shapes a category's member bottles take (#628): a short list (5 or
 * fewer) renders as plain rows — a drawer behind a trigger would be
 * ceremony over three rows — while a longer one previews three rows with a
 * see-all row opening the drawer that holds the full list.
 */
const INLINE_LIMIT = 5;

/** How many recipes the page previews above the see-all row. */
const PREVIEW_COUNT = 3;

function renderRecipe(recipe: RecipeListItem) {
  return (
    <RecipeLinkListItem
      key={recipe.href}
      href={recipe.href}
      name={recipe.name}
      source={recipe.source}
    />
  );
}

/**
 * A technique's recipe list under the calculator, in flow (the calculator
 * pages' own lists — the instructions — render the same way): a subheader
 * above a surface block of divider rows. `title` is also the group's
 * accessible name.
 */
export default function TechniqueRecipes({
  title,
  description,
  recipes,
}: {
  /** The list's header — also the drawer sheet's title. */
  title: string;
  /** The drawer sheet's description line. */
  description: string;
  /** The recipes using the technique, alphabetically (the data loaders' order). */
  recipes: RecipeListItem[];
}) {
  const headerId = useId();

  if (recipes.length === 0) return null;

  // The short-list shape: today's plain list, no trigger, no drawer.
  if (recipes.length <= INLINE_LIMIT) {
    return (
      <List>
        <li>
          <List role="group" aria-labelledby={headerId}>
            <li id={headerId}>
              <ListSubheader>{title}</ListSubheader>
            </li>
            <div className="surface">{recipes.map(renderRecipe)}</div>
          </List>
        </li>
      </List>
    );
  }

  // The long-list shape: three preview rows inside the same surface block,
  // the see-all row as its last row and the drawer's trigger. The sheet's
  // content stays mounted while closed (keepMounted), so every recipe link
  // remains in the static export's HTML for crawlers.
  const preview = recipes.slice(0, PREVIEW_COUNT);

  return (
    <List>
      <li>
        <List role="group" aria-labelledby={headerId}>
          <li id={headerId}>
            <ListSubheader>{title}</ListSubheader>
          </li>
          <div className="surface">
            {preview.map(renderRecipe)}
            <li>
              <ListDrawer
                title={title}
                description={description}
                keepContentMounted
                trigger={`See all ${recipes.length} recipes`}
                triggerClassName="flex w-full items-center justify-center gap-1 px-4 py-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <List>
                  <li>
                    <List role="group" aria-labelledby={`${headerId}-sheet`}>
                      <li id={`${headerId}-sheet`}>
                        <ListSubheader>{title}</ListSubheader>
                      </li>
                      <div className="surface">{recipes.map(renderRecipe)}</div>
                    </List>
                  </li>
                </List>
              </ListDrawer>
            </li>
          </div>
        </List>
      </li>
    </List>
  );
}
