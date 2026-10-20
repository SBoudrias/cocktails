import fs from 'node:fs/promises';
import path from 'node:path';
import { createSchemaFormatter } from '@cocktails/jsonschema-formatter';
import Ajv from 'ajv/dist/2020.js';
import { logger } from '../cli-util.ts';
import { PACKAGE_ROOT } from './paths.ts';
// Side-effect import: captures the run's start time before the registration
// loop below, keeping the summary's elapsed time faithful to the whole run.
import './start.ts';

// Loaded once at import time: this is a single-run CLI, and the validator,
// the key-ordering writer and the per-file checks all share one schema
// registry. Registering here (rather than in the bin) lets every module grab
// { ajv, formatter } directly instead of threading them through signatures.
logger.header('📝 Registering schemas');
const ajv = new Ajv();
const formatter = createSchemaFormatter();
for await (const schemaFile of fs.glob(
  path.join(PACKAGE_ROOT, 'schemas/*.schema.json'),
)) {
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
  const schemaId = path.basename(schemaFile);
  logger.item(schemaId);
  ajv.addSchema(schema, schemaId);
  formatter.addSchema(schema);
}
logger.footer('Done!');

export { ajv, formatter };
