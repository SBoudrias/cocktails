#!/usr/bin/env -S node --no-warnings

// @ts-check
import Ajv from 'ajv/dist/2020.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';

const ROOT = path.join(import.meta.dirname, '..');
const APP_ROOT = path.join(ROOT, 'src');

function fileExists(filepath) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

let exitCode = 0;
function fail(message) {
  console.error(`├ ❌ ${message}`);
  exitCode = 1;
}
function pass(message) {
  console.log(`├ ✅ ${message}`);
}
function change(message) {
  console.log(`├ 🔄 ${message}`);
}

const ajv = new Ajv();
console.log('╭ 📝 Registering schemas');
for await (const schemaFile of fs.glob('src/schemas/*.schema.json')) {
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
  console.log('├', schema.$id);
  ajv.addSchema(schema, schema.$id);
}
console.log('╰ Done!\n');

console.log('╭ 🔍 Validating data files...');
for await (const sourceFile of fs.glob('src/data/**/*.json')) {
  const data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
  if (!data.$schema) {
    fail(`$schema not defined in ${sourceFile}`);
    continue;
  }

  const schemaPath = path.relative(
    APP_ROOT,
    path.resolve(path.dirname(sourceFile), data.$schema),
  );
  const validate = ajv.getSchema(`file:///${schemaPath}`);

  if (!validate) {
    fail(`Schema not found for ${sourceFile} at ${data.$schema ?? 'undefined'}`);
    continue;
  }

  const isValid = validate(data);
  if (isValid) {
    pass(`Validation passed for ${sourceFile}`);
  } else {
    fail(`Validation failed for ${sourceFile}`);
    console.error(validate.errors);
  }

  const basename = path.basename(sourceFile, '.json');

  // Enforce filename should be the name of the data.
  if (basename !== '_source') {
    const expectedName = slugify(data.name);
    if (basename !== expectedName) {
      const newPath = path.join(path.dirname(sourceFile), `${expectedName}.json`);
      change(`Renaming ${path.basename(sourceFile)} to ${path.basename(newPath)}`);
      await fs.rename(sourceFile, newPath);
    }
  }

  if (schemaPath === 'schemas/recipe.schema.json') {
    // Make sure all ingredients of recipe have their metadata files
    for (const ingredient of data.ingredients) {
      const ingredientPath = path.join(
        'src/data/ingredients',
        ingredient.type,
        `${slugify(ingredient.name)}.json`,
      );
      if (!(await fileExists(ingredientPath))) {
        fail(`Ingredient file not found ${ingredientPath}`);

        await fs.mkdir(path.dirname(ingredientPath), { recursive: true });

        await fs.writeFile(
          ingredientPath,
          JSON.stringify(
            {
              $schema: path.relative(
                path.dirname(ingredientPath),
                path.resolve(APP_ROOT, 'schemas/ingredient.schema.json'),
              ),
              ...ingredient,
              quantity: undefined,
            },
            null,
            2,
          ) + '\n',
        );
      }
    }
  }

  if (schemaPath === 'schemas/ingredient.schema.json') {
    // Make sure there's all categories have their metadata files
    for (const category of data.categories ?? []) {
      const categoryPath = path.join('src/data/categories', `${slugify(category)}.json`);
      if (!(await fileExists(categoryPath))) {
        fail(`Category file not found ${categoryPath}`);

        await fs.mkdir(path.dirname(categoryPath), { recursive: true });

        await fs.writeFile(
          categoryPath,
          JSON.stringify(
            {
              $schema: path.relative(
                path.dirname(categoryPath),
                path.resolve(APP_ROOT, 'schemas/category.schema.json'),
              ),
              name: category,
            },
            null,
            2,
          ) + '\n',
        );
      }
    }
  }
}
console.log('╰ Done!');

process.exit(exitCode);
