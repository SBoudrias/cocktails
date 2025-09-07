Always read `README.md` when starting.

# Project setting

- Use ES modules (import/export) syntax, not CommonJS (require)
- This project uses yarn instead of npm or other package manager.
- This project uses Node 24, this means scripts can be `*.ts` files and simply executed with `node file.ts` with the built-in type-stripping support.

# Commands

- `yarn vitest --run` to run tests
- `yarn tsc --noEmit` to typecheck
- `yarn check-data` to validate schemas and json data files. Do note this command will also autofix many errors.

# Code style

- Steer away from forcing types; like by using `any` or `as Type` with typescript.
- Imports within the Next.js web-app should be written importing from the root with the `@/...` alias. Only use relative imports when importing files located the same folder.

# Testing

This project uses vitest for testing (use `yarn vitest --run` to run tests)

It also uses React testing-library as the main testing utility. Uses semantic tests as much as possible. For example:

```ts
// Don't search everywhere for strings
expect(screen.queryByText('bar')).not.toBeInTheDocument();
expect(screen.getByText('foo')).toBeInTheDocument();

// Do: select the semantic item, and assert against its text content.
const listItems = screen.getAllByRole('listitem');
expect(listItems[0]).not.toHaveTextContent('bar');
expect(listItems[0]).toHaveTextContent('foo');
```
