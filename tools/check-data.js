#!/usr/bin/env -S node --no-warnings

// @ts-check
import Ajv from 'ajv/dist/2020.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';

let exitCode = 0;

function fileExists(filepath) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

const SCHEMAS = {};

const ajv = new Ajv();
console.log('╭ 📝 Registering schemas');
for await (const schemaFile of fs.glob('src/schemas/*.schema.json')) {
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
  console.log('├', schema.$id);
  ajv.addSchema(schema, schema.$id);

  SCHEMAS[path.basename(schema.$id).replace(/\.schema\.json$/, '')] = schema.$id;
}
console.log('╰ Done!\n');

console.log('╭ 🔍 Validating data files...');
for await (const sourceFile of fs.glob('src/data/**/*.json')) {
  const data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
  const validate = data.$schema
    ? ajv.getSchema(`file:///schemas/${path.basename(data.$schema)}`)
    : undefined;

  if (!validate) {
    console.error(
      `├ ❌ Schema not found for ${sourceFile} at ${data.$schema ?? 'undefined'}`,
    );

    exitCode = 1;
    continue;
  }

  const dirname = path.basename(path.dirname(sourceFile));
  const basename = path.basename(sourceFile, '.json');

  const isValid = validate(data);

  if (isValid) {
    console.log(`├ ✅ Validation passed for ${sourceFile}`);
  } else {
    console.error(`├ ❌ Validation failed for ${sourceFile}`);
    console.error(validate.errors);

    exitCode = 1;
  }

  // Enforce filename should be the name of the data.
  if (basename !== '_source') {
    const expectedName = slugify(data.name);
    if (basename !== expectedName) {
      const newPath = path.join(path.dirname(sourceFile), `${expectedName}.json`);
      console.log(
        `├ 🔄 Renaming ${path.basename(sourceFile)} to ${path.basename(newPath)}`,
      );
      await fs.rename(sourceFile, newPath);
    }
  }

  if (dirname === 'recipes') {
    // Make sure there's an ingredient file per recipe
    for (const ingredient of data.ingredients) {
      const ingredientPath = path.join(
        'src/data/ingredient',
        ingredient.type,
        `${slugify(ingredient.name)}.json`,
      );
      if (!(await fileExists(ingredientPath))) {
        console.error(`├ ❌ Ingredient file not found ${ingredientPath}`);
        exitCode = 1;

        await fs.mkdir(path.dirname(ingredientPath), { recursive: true });
        await fs.writeFile(
          ingredientPath,
          JSON.stringify(
            {
              $schema: '../../../schemas/ingredient.schema.json',
              ...ingredient,
              quantity: undefined,
            },
            null,
            2,
          ),
        );
      }
    }
  }
}
console.log('╰ Done!');

process.exit(exitCode);
