import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createSchemaFormatter,
  type SchemaFormatter,
} from '@cocktails/jsonschema-formatter';
import Ajv from 'ajv/dist/2020.js';
import { logger } from './cli-util.ts';
import { PACKAGE_ROOT } from './paths.ts';

/**
 * Loads every schema under packages/data/schemas into the ajv validator (keyed
 * by schema filename) and the key-ordering formatter. Logs the registration
 * report.
 */
export async function loadSchemas(): Promise<{
  ajv: Ajv;
  formatter: SchemaFormatter;
}> {
  const ajv = new Ajv();
  const formatter = createSchemaFormatter();

  logger.header('📝 Registering schemas');
  const schemasGlob = path.join(PACKAGE_ROOT, 'schemas/*.schema.json');
  for await (const schemaFile of fs.glob(schemasGlob)) {
    const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
    const schemaId = path.basename(schemaFile);
    logger.item(schemaId);
    ajv.addSchema(schema, schemaId);
    formatter.addSchema(schema);
  }
  logger.footer('Done!');

  return { ajv, formatter };
}
