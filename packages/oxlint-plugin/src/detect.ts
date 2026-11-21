/**
 * Left-behind merge-conflict marker detection, shared by the oxlint rule
 * (`plugin.ts`, for JS/TS/JSX files) and the whole-tree scanner
 * (`scan-conflicts.ts`, for everything oxlint never parses).
 *
 * Git emits four marker lines, always at column 0, always exactly seven
 * characters followed by a space and a label — or nothing at all:
 *
 * - `start`: opens a conflict, two-way and diff3 alike
 * - `base`: diff3 only — the common ancestor section. A resolution script
 *   once stripped the angle markers but kept this section, which compiled
 *   as JSX text and rendered raw on the homepage (#632), so it is always
 *   reported, bracketed or not
 * - `separator`: splits our side from their side
 * - `end`: closes the block
 *
 * A `=======` line alone is NOT a marker: standalone runs of `=` are
 * legitimate text (setext headings in Markdown, banner comments), so the
 * separator is only reported inside an open conflict block — between a
 * `<<<<<<<` and its `>>>>>>>`. The other three have no legitimate lookalike
 * at column 0, so they are always reported.
 */

type ConflictMarkerKind = 'start' | 'base' | 'separator' | 'end';

export type ConflictMarker = {
  /** 1-based line number. */
  line: number;
  kind: ConflictMarkerKind;
  /** The marker line, without the line break or a trailing carriage return. */
  text: string;
};

const MARKER_LENGTH = 7;

function isMarkerLine(line: string, char: string): boolean {
  if (!line.startsWith(char.repeat(MARKER_LENGTH))) return false;
  return line.length === MARKER_LENGTH || line[MARKER_LENGTH] === ' ';
}

/**
 * Find left-behind merge-conflict markers in a list of source lines.
 */
export function findConflictMarkers(lines: readonly string[]): ConflictMarker[] {
  const markers: ConflictMarker[] = [];
  let inConflict = false;

  for (const [index, raw] of lines.entries()) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (isMarkerLine(line, '<')) {
      markers.push({ line: index + 1, kind: 'start', text: line });
      inConflict = true;
    } else if (isMarkerLine(line, '>')) {
      markers.push({ line: index + 1, kind: 'end', text: line });
      inConflict = false;
    } else if (isMarkerLine(line, '|')) {
      // The #632 shape: a resolution script stripped the angle markers but
      // kept the diff3 base section, which compiled as JSX text and rendered
      // raw on the homepage. Pipe markers have no legitimate lookalike at
      // column 0, so this is unconditional — and the section it opens runs
      // to the next `=======` separator, which is residue of the same
      // conflict and must be reported too.
      markers.push({ line: index + 1, kind: 'base', text: line });
      inConflict = true;
    } else if (inConflict && isMarkerLine(line, '=')) {
      markers.push({ line: index + 1, kind: 'separator', text: line });
    }
  }

  return markers;
}
