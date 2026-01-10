Start by reading @README.md

# Environment

- Module: `esm`. Use ES modules (import/export) syntax, not CommonJS (require)
- Package manager: `yarn`.
- Node version: >=24. This means scripts should always be `*.ts` files and simply executed with `node file.ts` with the built-in type-stripping support. This also means you must use modern JavaScript features, like `toSorted` instead of `sort`, etc.
- Framework: Next.js.

# Commands

- `yarn vitest --run` to run tests
- `yarn lint` to lint and typecheck the codebase
- `yarn check-data` to validate schemas and json data files. Do note this command will also autofix many errors.

# Code style

- Don't force types. Don't use patterns like `any` or `as Type` with typescript.
- Imports within the Next.js web-app should be written importing from the root with the `@/...` alias. Only use relative imports when importing files located inside the same folder.
- Always use `ts-pattern` when matching on types. (instead of `switch` or `if`)
- Don't re-export from modules. Import directly from the original source.
- Only export functions that are actually used. Don't pre-export "for future use" - that's dead code.
- Inline types that won't be reused instead of creating separate type definitions.
- Handle null/undefined inside functions rather than requiring callers to handle it.
- Trim string outputs when building search text or similar concatenated strings.
- Keep accessibility attributes (role, aria-\*) inside the component that renders the element, not in wrapper components.

# Testing

This project uses vitest and React testing library for testing. Test utilities are in `@/testing`.

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

The application follows a data-driven architecture with JSON files as the primary data source, TypeScript modules for business logic, and React components for UI.

## Directory Organization

### `/src/app` - Next.js App Router

- **Pages**: Route-based pages using Next.js 15 app directory structure
- **Layout**: Global layout and theme configuration
- **API Routes**: Manifest and other API endpoints

### `/src/components` - Reusable UI Components

- Each component in its own folder with `index.tsx`
- CSS modules for styling (`.module.css`)
- Component-specific logic and utilities

### `/src/data` - JSON Data Files

```
src/data/
├── categories/          # Ingredient categories (gin, rum, etc.)
├── ingredients/         # Individual ingredients by type
│   ├── spirit/
│   ├── liqueur/
│   ├── juice/
│   └── [other-types]/
└── recipes/             # Recipes organized by source
    ├── book/
    └── youtube-channel/
```

### `/src/modules` - Business Logic

- Pure TypeScript modules for data processing
- Memoized functions for performance
- Utility functions for conversions, filtering, etc.

### `/src/schemas` - JSON Schema Definitions

- Schema validation for all data files
- Enforces data consistency and structure

### `/src/types` - TypeScript Type Definitions

- Shared interfaces and types
- Corresponds to JSON schemas

## Data File Conventions

### Recipe Files

- Path: `src/data/recipes/[type]/[source]/[slug].json`
- Must include `$schema` reference
- Use URL-safe slugs for filenames

### Ingredient Files

- Path: `src/data/ingredients/[type]/[slug].json`
- Categorized by ingredient type
- Reuse existing ingredient names when possible

### Category Files

- Path: `src/data/categories/[slug].json`
- Define ingredient categories and hierarchies
