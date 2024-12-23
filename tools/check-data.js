#!/usr/bin/env -S node --no-warnings

// @ts-check
import Ajv from 'ajv/dist/2020.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { type } from 'node:os';

const ROOT = path.join(import.meta.dirname, '..');
const APP_ROOT = path.join(ROOT, 'src');

function fileExists(filepath) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeJSON(filepath, data) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(data, null, 2) + '\n');
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
  let data;
  try {
    data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
  } catch (error) {
    fail(`Invalid JSON in ${sourceFile} ${error.message}`);
    continue;
  }

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

  // Enforce filename should be the name of the data.
  const basename = path.basename(sourceFile, '.json');
  if (basename !== '_source') {
    const expectedName = slugify(data.name);
    if (basename !== expectedName) {
      const newPath = path.join(path.dirname(sourceFile), `${expectedName}.json`);
      change(`Renaming ${path.basename(sourceFile)} to ${path.basename(newPath)}`);
      await fs.rename(sourceFile, newPath);
    }
  }

  // Make sure all ingredients of recipe have their metadata files
  if (schemaPath === 'schemas/recipe.schema.json') {
    for (const ingredient of data.ingredients) {
      if (ingredient.type === 'category') {
        const categoryPath = path.join(
          'src/data/categories',
          `${slugify(ingredient.name)}.json`,
        );
        if (!(await fileExists(categoryPath))) {
          fail(`Ingredient file not found ${categoryPath}`);

          await writeJSON(categoryPath, {
            $schema: path.relative(
              path.dirname(categoryPath),
              path.resolve(APP_ROOT, 'schemas/category.schema.json'),
            ),
            ...ingredient,
            type: undefined,
            quantity: undefined,
            brix: undefined,
          });
        }
      } else {
        const ingredientPath = path.join(
          'src/data/ingredients',
          ingredient.type,
          `${slugify(ingredient.name)}.json`,
        );
        if (!(await fileExists(ingredientPath))) {
          fail(`Ingredient file not found ${ingredientPath}`);

          await writeJSON(ingredientPath, {
            $schema: path.relative(
              path.dirname(ingredientPath),
              path.resolve(APP_ROOT, 'schemas/ingredient.schema.json'),
            ),
            ...ingredient,
            quantity: undefined,
            brix: undefined,
          });
        }
      }
    }
  }

  // Make sure there's all categories have their metadata files
  if (schemaPath === 'schemas/ingredient.schema.json') {
    for (const category of data.categories ?? []) {
      const categoryPath = path.join('src/data/categories', `${slugify(category)}.json`);
      if (!(await fileExists(categoryPath))) {
        fail(`Category file not found ${categoryPath}`);

        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(APP_ROOT, 'schemas/category.schema.json'),
          ),
          name: category,
        });
      }
    }
  }

  // Make sure there's all parent categories have their metadata files
  if (schemaPath === 'schemas/category.schema.json') {
    for (const category of data.parents ?? []) {
      const categoryPath = path.join('src/data/categories', `${slugify(category)}.json`);
      if (!(await fileExists(categoryPath))) {
        fail(`Category file not found ${categoryPath}`);

        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(APP_ROOT, 'schemas/category.schema.json'),
          ),
          name: category,
        });
      }
    }
  }
}
console.log('╰ Done!');

process.exit(exitCode);
