# Technology Stack

## Framework & Core Technologies

- **Next.js 15.1.7** - React framework with static export configuration
- **React 19** - UI library
- **TypeScript** - Type safety with strict mode enabled
- **Material-UI (MUI)** - Component library with Emotion styling
- **Yarn 4.6.0** - Package manager (required)

## Key Libraries

- **@leeoniya/ufuzzy** - Fuzzy search functionality
- **nuqs** - URL state management
- **ts-pattern** - Pattern matching for TypeScript
- **lodash** - Utility functions
- **@sindresorhus/slugify** - URL-safe slug generation

## Development Tools

- **Vitest** - Testing framework with jsdom
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **nano-staged** - Staged file processing
- **AJV** - JSON schema validation

## Build Configuration

- Static export mode (`output: 'export'`)
- Base path: `/cocktails`
- Turbopack for development
- Automatic sitemap generation

## Common Commands

```bash
# Development
yarn dev              # Start dev server with Turbopack
yarn build            # Build for production
yarn start            # Start production server

# Quality Assurance
yarn lint             # TypeScript check + ESLint
yarn test             # Run Vitest tests
yarn check-code       # Prettier format check
yarn check-data       # Validate JSON data files

# Data Management
tools/check-data.js   # Validate all recipe/ingredient schemas
```

## Schema Validation

All JSON data files must conform to schemas in `src/schemas/`. Use AJV for validation during development.
