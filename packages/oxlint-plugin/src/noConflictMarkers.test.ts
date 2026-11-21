/**
 * Rule tests for `repo/no-conflict-markers`, run through oxlint's own
 * `RuleTester` (from the `oxlint/plugins-dev` export) so the rule is exercised
 * against the real parser, not a stub context.
 *
 * Marker lines are built with `repeat()` rather than written literally: the
 * fixtures below would otherwise sit at column 0 inside this test file, and
 * this repo's own gates (`repo/no-conflict-markers` plus
 * `scan-conflicts.ts`) must stay clean.
 */
import { RuleTester } from 'oxlint/plugins-dev';
import { noConflictMarkers } from './plugin.ts';

// `<<<<<<< HEAD`, `|||||||`, `=======`, `>>>>>>> branch` — assembled, never
// spelled out at column 0.
const start = `${'<'.repeat(7)} HEAD`;
const base = '|'.repeat(7);
const separator = '='.repeat(7);
const end = `${'>'.repeat(7)} other-branch`;

const tester = new RuleTester({ languageOptions: { sourceType: 'module' } });

tester.run('no-conflict-markers', noConflictMarkers, {
  valid: [
    'const abv = 40;',
    {
      name: 'a banner comment of equals signs is not a separator',
      code: `// ${'='.repeat(20)}\nconst abv = 40;`,
    },
    {
      name: 'a bare equals run outside any conflict block is text',
      code: `const banner = \`${separator}\`;`,
    },
    {
      name: 'a quoted marker inside a string is not at column 0',
      code: `const note = '${'<'.repeat(7)} not a conflict, just arrows';`,
    },
  ],
  invalid: [
    {
      // The #632 shape: a resolution script stripped the angle markers but
      // kept the diff3 base section, which compiled as JSX text.
      name: 'a diff3 base section compiles as JSX text and renders raw',
      filename: 'conflicted.tsx',
      code: `export const Page = () => (\n  <p>\n${base}\n    old pre-rebase block\n${separator}\n    resolved block\n  </p>\n);`,
      errors: [
        { messageId: 'conflictMarker', line: 3, column: 0, endColumn: base.length },
        { messageId: 'conflictMarker', line: 5, column: 0, endColumn: separator.length },
      ],
    },
    {
      name: 'a full conflict block inside a template literal',
      filename: 'conflicted.ts',
      code: `const recipe = \`\n${start}\nours\n${base}\ncommon\n${separator}\ntheirs\n${end}\n\`;`,
      errors: [
        { messageId: 'conflictMarker', line: 2, column: 0, endColumn: start.length },
        { messageId: 'conflictMarker', line: 4, column: 0, endColumn: base.length },
        { messageId: 'conflictMarker', line: 6, column: 0, endColumn: separator.length },
        { messageId: 'conflictMarker', line: 8, column: 0, endColumn: end.length },
      ],
    },
    {
      name: 'a stray start marker inside a comment',
      code: `/*\n${start}\n*/\nconst abv = 40;`,
      errors: [
        { messageId: 'conflictMarker', line: 2, column: 0, endColumn: start.length },
      ],
    },
    {
      name: 'a stray end marker inside a comment',
      code: `/*\n${end}\n*/\nconst abv = 40;`,
      errors: [
        { messageId: 'conflictMarker', line: 2, column: 0, endColumn: end.length },
      ],
    },
  ],
} satisfies RuleTester.TestCases);
