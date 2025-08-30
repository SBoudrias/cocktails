Always read `README.md` when starting.

# Project setting

- Use ES modules (import/export) syntax, not CommonJS (require)
- This project uses yarn instead of npm or other package manager.
- This project uses vitest for testing (use `yarn vitest --run` to run tests)
- This project uses Node 24, this means scripts can be `*.ts` files and simply executed with `node file.ts` with the built-in type-stripping support.

# Commands

- `yarn vitest --run` to run tests
- `yarn tsc --noEmit` to typecheck
- `yarn check-data` to validate changes to schemas or json data files

# Code style

- Steer away from forcing types; like by using `any` or `as Type` with typescript.
