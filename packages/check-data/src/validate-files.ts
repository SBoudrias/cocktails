import fs from 'node:fs/promises';
import path from 'node:path';
import type { SchemaFormatter } from '@cocktails/jsonschema-formatter';
import type Ajv from 'ajv/dist/2020.js';
import { checkAttributions } from './attributions.ts';
import { checkAuthorSources } from './author-sources.ts';
import { logger } from './cli-util.ts';
import type { DataContext } from './data-context.ts';
import { checkFileIntegrity } from './file-integrity.ts';
import { canonicalizeFile } from './ingredient-canonicalization.ts';
import { applyKeyOrdering } from './key-order.ts';
import { createMissingMetadata } from './metadata-creation.ts';
import { PACKAGE_ROOT } from './paths.ts';
import { checkRefs } from './refs.ts';
import type { Report } from './report.ts';
import type { DataWithSchema, Ingredient } from './types.ts';
import type { WriteJSON } from './write-json.ts';

/**
 * The per-file validation pass: walks every data file, runs the integrity
 * check (schema, $schema path, filename, folder), then the refs, author
 * sources and attributions checks, the canonicalization and metadata-creation
 * autofixes, and the silent key-ordering rewrite.
 */
export async function validateFiles(input: {
  ajv: Ajv;
  formatter: SchemaFormatter;
  ctx: DataContext;
  report: Report;
  writeJSON: WriteJSON;
}): Promise<void> {
  const { ajv, formatter, ctx, report, writeJSON } = input;
  const fail = report.fail;

  logger.header('🔍 Validating data files...');
  const dataGlob = path.join(PACKAGE_ROOT, 'data/**/*.json');
  for await (const sourceFile of fs.glob(dataGlob)) {
    let data: DataWithSchema;
    try {
      data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
    } catch (error) {
      fail(`Invalid JSON in ${sourceFile} ${(error as Error).message}`);
      continue;
    }

    const integrity = await checkFileIntegrity({
      sourceFile,
      data,
      ajv,
      ctx,
      report,
      writeJSON,
    });
    if (!integrity) continue;
    const { schemaPath, isValid } = integrity;
    const fileInput = {
      data,
      file: sourceFile,
      schemaPath,
      isValid,
      ctx,
      report,
      writeJSON,
    };

    checkRefs(fileInput);
    checkAuthorSources(fileInput);
    checkAttributions(fileInput);

    const preCanonicalizationIngredients: Ingredient[] = data.ingredients ?? [];
    await canonicalizeFile(fileInput);
    await createMissingMetadata({
      ...fileInput,
      preCanonicalizationIngredients,
    });

    // Apply key ordering to all data files (silently)
    await applyKeyOrdering({ data, file: sourceFile, formatter, writeJSON });
  }
  logger.footer('Done!');
}
