import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../../cli-util.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import type { DataWithSchema, Ingredient } from '../../infra/types.ts';
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
export async function validateFiles(): Promise<void> {
  logger.header('🔍 Validating data files...');
  const dataGlob = path.join(PACKAGE_ROOT, 'data/**/*.json');
  for await (const sourceFile of fs.glob(dataGlob)) {
    let data: DataWithSchema;
    try {
      data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
    } catch (error) {
      report.fail(`Invalid JSON in ${sourceFile} ${(error as Error).message}`);
      continue;
    }

    const integrity = await checkFileIntegrity(sourceFile, data);
    if (!integrity) continue;

    const fileInput = { data, file: sourceFile, ...integrity };

    checkRefs(fileInput);
    checkAuthorSources(fileInput);
    checkAttributions(fileInput);

    const preCanonicalizationIngredients: Ingredient[] = data.ingredients ?? [];
    await canonicalizeFile(fileInput);
    await createMissingMetadata({ ...fileInput, preCanonicalizationIngredients });

    // Apply key ordering to all data files (silently)
    await applyKeyOrdering(data, sourceFile);
  }
  logger.footer('Done!');
}
