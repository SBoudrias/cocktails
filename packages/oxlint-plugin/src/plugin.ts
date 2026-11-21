/**
 * This repo's oxlint JS plugin, loaded from `.oxlintrc.json` through
 * `jsPlugins` as `./packages/oxlint-plugin/src/plugin.ts` — the rules here
 * run on every JS/TS/JSX file `yarn lint` covers, alongside the stock Rust
 * plugins.
 *
 * `no-conflict-markers` fails on left-behind merge-conflict marker lines
 * (the #632 incident: a diff3 base section compiled as JSX text and
 * rendered raw on the homepage). Non-JS files are covered by
 * `scan-conflicts.ts`, the last step of the root lint script.
 */
import { findConflictMarkers } from './detect.ts';

// Minimal shape of the oxlint rule context this rule uses; see
// node_modules/oxlint/dist/plugins-dev.d.ts for the full interface.
type RuleContext = {
  readonly sourceCode: {
    getLines(): readonly string[];
  };
  report(diagnostic: {
    loc: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
    messageId: string;
    data: { marker: string };
  }): void;
};

export const noConflictMarkers = {
  meta: {
    type: 'problem' as const,
    docs: {
      description:
        'Fail on left-behind merge-conflict marker lines (start, base, separator and end)',
    },
    messages: {
      conflictMarker:
        'Left-behind merge conflict marker {{marker}} — resolve the conflict and remove the markers.',
    },
  },
  create(context: RuleContext) {
    return {
      Program() {
        for (const marker of findConflictMarkers(context.sourceCode.getLines())) {
          context.report({
            loc: {
              start: { line: marker.line, column: 0 },
              end: { line: marker.line, column: marker.text.length },
            },
            messageId: 'conflictMarker',
            data: { marker: marker.text },
          });
        }
      },
    };
  },
};

export default {
  meta: { name: 'repo' },
  rules: {
    'no-conflict-markers': noConflictMarkers,
  },
};
