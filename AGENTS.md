Start by reading @README.md

# Environment

- Module: `esm`. Use ES modules (import/export) syntax, not CommonJS (require)
- Package manager: `yarn`. Run `yarn install` when starting work from a new worktree.
- Node version: >=24. This means scripts should always be `*.ts` files and simply executed with `node file.ts` with the built-in type-stripping support. This also means you must use modern JavaScript features, like `toSorted` instead of `sort`, etc.
- Framework: Next.js.
- Monorepo: Yarn workspaces with packages in `apps/` and `packages/`

# Commands

- `yarn vitest --run` to run tests
- `yarn lint` to lint and typecheck the codebase
- `yarn check-data` to validate schemas and json data files. Do note this command will also autofix many errors.

# Code style

- Don't force types. Don't use patterns like `any` or `as Type` with typescript.
- Imports within the Next.js web-app (`apps/web/`) should use `#/...` subpath imports for local files. For data and types, import from `@cocktails/data`.
- Always use `ts-pattern` when matching on types. (instead of `switch` or `if`)
- Don't re-export from modules. Import directly from the original source.
- Only export functions that are actually used. Don't pre-export "for future use" - that's dead code.
- Inline types that won't be reused instead of creating separate type definitions.
- Handle null/undefined inside functions rather than requiring callers to handle it.
- Trim string outputs when building search text or similar concatenated strings.
- Keep accessibility attributes (role, aria-\*) inside the component that renders the element, not in wrapper components.
- Keep generic behavior (like back navigation) inside components rather than passing callbacks down.
- Use Next.js Link href objects instead of manually building URL strings:

  ```tsx
  // DON'T: manual URL string building
  const params = new URLSearchParams({ search: term });
  <Link href={`/search?${params.toString()}`}>

  // DO: Next.js href object
  <Link href={{ pathname: '/search', query: { search: term } }}>
  ```

# Testing

This project uses vitest and React testing library for testing. Test utilities are in `#/testing`.

## Test page components, not internals

Import and test the page component (`page.tsx`) rather than internal client components. This keeps tests agnostic of implementation details.

```ts
// DON'T: test internal components
import RecipesClient from './RecipesClient';
renderWithNuqs(<RecipesClient recipes={mockRecipes} />);

// DO: test the page component
import RecipesPage from './page';
vi.mock('@cocktails/data', () => ({ getAllRecipes: vi.fn() }));
renderWithNuqs(await RecipesPage());
```

## Semantic selectors over data-testid

Never use `data-testid`. Use semantic roles and aria attributes instead:

```ts
// DON'T: data-testid
expect(screen.getByTestId('results')).toHaveTextContent('Mojito');

// DON'T: search everywhere for strings
expect(screen.queryByText('bar')).not.toBeInTheDocument();
expect(screen.getByText('foo')).toBeInTheDocument();

// DO: select by semantic role and check text content
const resultList = screen.getByRole('list');
expect(resultList).toHaveTextContent('Mojito');
expect(resultList).not.toHaveTextContent('Daiquiri');

// DO: use aria-labelledby for grouped content
const mGroup = screen.getByRole('group', { name: 'M' });
expect(mGroup).toHaveTextContent('Mojito');
```

## Be specific with role queries

Always add the `name` option to role queries when possible:

```ts
// DON'T: broad query that could match wrong element
const link = screen.getByRole('link');

// DO: specific query with name
const link = screen.getByRole('link', { name: /search all recipes/i });
```

## Use specific mock assertions

```ts
// DON'T: manually extract last call
expect(onUrlUpdate).toHaveBeenCalled();
const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
expect(lastCall?.queryString).toContain('search=dai');

// DO: use toHaveBeenLastCalledWith
expect(onUrlUpdate).toHaveBeenLastCalledWith(
  expect.objectContaining({ queryString: '?search=dai' }),
);
```

## Use meaningful expressions, not magic numbers

```ts
// DON'T: magic number
expect(onChange).toHaveBeenCalledTimes(9);

// DO: express the intent
expect(onChange).toHaveBeenCalledTimes('margarita'.length);
```

## Prefer inline snapshots for complex outputs

```ts
// DON'T: hide the expected value
expect(getSearchText(item)).toBe(expectedText);

// DO: inline snapshot shows full output
expect(getSearchText(item)).toMatchInlineSnapshot(`"rum aged jamaican"`);
```

## Use URL factory functions

```ts
// DON'T: magic strings for URLs
expect(link).toHaveAttribute('href', '/recipes/book/test-source/recipe-1');

// DO: use URL factory functions
expect(link).toHaveAttribute('href', getRecipeUrl(recipe));
```

# Project Structure

## Core Architecture

This is a Yarn workspaces monorepo with:

- `apps/web/` - Next.js web application (@cocktails/web)
- `packages/data/` - Data layer with JSON files, schemas, types, and business logic (@cocktails/data)
- `packages/youtube-sync/` - YouTube channel sync utility (@cocktails/youtube-sync)

## Directory Organization

### `apps/web/` - Next.js Web App

```
apps/web/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI components
│   ├── hooks/         # React hooks
│   └── testing/       # Test utilities
├── tools/             # Web app specific tools
└── public/            # Static assets
```

### `packages/data/` - Data Layer

```
packages/data/
├── data/
│   ├── categories/    # Ingredient categories (gin, rum, etc.)
│   ├── ingredients/   # Individual ingredients by type
│   └── recipes/       # Recipes organized by source
├── schemas/           # JSON Schema definitions
├── src/
│   ├── modules/       # Business logic
│   ├── types/         # TypeScript types
│   └── index.ts       # Package entry point
└── tools/             # Data validation tools
```

### `packages/youtube-sync/` - YouTube Sync Utility

```
packages/youtube-sync/
└── src/
    ├── youtube-sync.ts
    └── youtube-api.ts
```

## Importing from @cocktails/data

The data package has multiple entry points via subpath exports:

- `@cocktails/data` - Types and pure functions (safe for both server and client)
- `@cocktails/data/recipes` - Recipe loading functions (server-side only)
- `@cocktails/data/ingredients` - Ingredient loading functions (server-side only)
- `@cocktails/data/categories` - Category loading functions (server-side only)
- `@cocktails/data/sources` - Source loading functions (server-side only)
- `@cocktails/data/params` - URL parameter utilities (server-side only)

### Types and Pure Functions (Client-safe)

```ts
// Import types from the main entry point
import type { Recipe, Category, RootIngredient } from '@cocktails/data';

// Pure functions (no Node.js dependencies) also come from main entry
import { compareIngredients, parseChapterFolder } from '@cocktails/data';
```

### Data Loading Functions (Server Components Only)

```ts
// Server components import data-loading functions from subpaths
import { getAllRecipes, getRecipe } from '@cocktails/data/recipes';
import { getIngredient, getAllIngredients } from '@cocktails/data/ingredients';
import { getCategory, getAllCategories } from '@cocktails/data/categories';
import { getAllSources, getSource } from '@cocktails/data/sources';
```

## Data File Conventions

### Recipe Files

- Path: `packages/data/data/recipes/[type]/[source]/[slug].json`
- Must include `$schema` reference
- Use URL-safe slugs for filenames

### Ingredient Files

- Path: `packages/data/data/ingredients/[type]/[slug].json`
- Categorized by ingredient type
- Reuse existing ingredient names when possible

### Category Files

- Path: `packages/data/data/categories/[slug].json`
- Define ingredient categories and hierarchies
