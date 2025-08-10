# Project Structure

## Core Architecture

The application follows a data-driven architecture with JSON files as the primary data source, TypeScript modules for business logic, and React components for UI.

## Directory Organization

### `/src/app` - Next.js App Router

- **Pages**: Route-based pages using Next.js 13+ app directory structure
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

## Import Conventions

- Use `@/` alias for src directory imports
- Prefer named exports over default exports
- Group imports: external libraries, then internal modules
