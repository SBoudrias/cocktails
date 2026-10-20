import fs from 'node:fs/promises';
import path from 'node:path';
import type { SchemaFormatter } from '@cocktails/jsonschema-formatter';
import type Ajv from 'ajv/dist/2020.js';
import { logger } from '../../cli-util.ts';
import type { DataContext } from '../../context/data-context.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import type { Report } from '../../infra/report.ts';
import type { DataWithSchema, Ingredient } from '../../infra/types.ts';
import type { WriteJSON } from '../../infra/write-json.ts';
import { checkAttributions } from './attributions.ts';
import { checkAuthorSources } from './author-sources.ts';
import { canonicalizeFile } from './canonicalization.ts';
import { checkFileIntegrity } from './file-integrity.ts';
import { applyKeyOrdering } from './key-order.ts';
import { createMissingMetadata } from './metadata-creation.ts';
import { checkRefs } from './refs.ts';

/**
 * The per-file validation pass: walks every data file, runs the integrity
 * check (schema, $schema path, filename, folder), then the refs, author
 * sources and attributions checks, the canonicalization and metadata-creation
 * autofixes, and the silent key-ordering rewrite.
 */
export async function validateFiles({
  ajv,
  formatter,
  ctx,
  report,
  writeJSON,
}: {
  ajv: Ajv;
  formatter: SchemaFormatter;
  ctx: DataContext;
  report: Report;
  writeJSON: WriteJSON;
}): Promise<void> {
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
