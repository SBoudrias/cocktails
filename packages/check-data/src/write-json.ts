import fs from 'node:fs/promises';
import path from 'node:path';
import { type SchemaFormatter } from '@cocktails/jsonschema-formatter';
import { format as formatWithOxfmt, type FormatConfig } from 'oxfmt';
import type { Report } from './report.ts';

// The `oxfmt` API does not discover `.oxfmtrc.json` like the CLI does, so the
// repo config is loaded and passed explicitly. Without it, files written by
// `writeJSON` drift away from `yarn oxfmt` formatting.
const OXFMT_CONFIG_PATH = path.join(import.meta.dirname, '../../../.oxfmtrc.json');
const oxfmtConfig: FormatConfig = JSON.parse(
  await fs.readFile(OXFMT_CONFIG_PATH, 'utf-8').catch((error: unknown) => {
    throw new Error(
      `Could not read the oxfmt config at ${OXFMT_CONFIG_PATH}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }),
);

/** The canonical JSON writer, as created by {@link createWriteJSON}. */
export type WriteJSON = (filepath: string, data: object) => Promise<void>;

/**
 * Creates the canonical JSON writer: sorts keys through the schema formatter,
 * formats through the repo oxfmt config, and creates parent folders as
 * needed. On oxfmt failure the raw JSON is written and the run is failed.
 */
export function createWriteJSON(input: { formatter: SchemaFormatter; report: Report }) {
  return async function writeJSON(filepath: string, data: object): Promise<void> {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    const sortedData = input.formatter.format(data);
    const jsonContent = JSON.stringify(sortedData, null, 2) + '\n';
    const formattedJson = await formatWithOxfmt(filepath, jsonContent, oxfmtConfig);
    if (formattedJson.errors.length > 0) {
      input.report.fail(
        `Could not format ${filepath}: ${formattedJson.errors[0]?.message}`,
      );
      await fs.writeFile(filepath, jsonContent);
      return;
    }
    await fs.writeFile(filepath, formattedJson.code);
  };
}
