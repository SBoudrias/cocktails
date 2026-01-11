#!/usr/bin/env -S node --no-warnings

import Ajv from 'ajv/dist/2020.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { format, resolveConfig } from 'prettier';

const ROOT = path.join(import.meta.dirname, '..');
const APP_ROOT = path.join(ROOT, 'src');

interface Ingredient {
  type: string;
  name: string;
  brix?: number;
}

interface DataWithSchema {
  $schema: string;
  name: string;
  type?: string;
  ingredients?: Ingredient[];
  categories?: string[];
  parents?: string[];
}

async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeJSON(filepath: string, data: object): Promise<void> {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  const jsonContent = JSON.stringify(data, null, 2);
  const prettierConfig = await resolveConfig(filepath);
  const formattedContent = await format(jsonContent, {
    ...prettierConfig,
    parser: 'json',
    filepath,
  });
  await fs.writeFile(filepath, formattedContent);
}

let exitCode = 0;
function fail(message: string): void {
  console.error(`├ ❌ ${message}`);
  exitCode = 1;
}
function pass(message: string): void {
  console.log(`├ ✅ ${message}`);
}
function change(message: string): void {
  console.log(`├ 🔄 ${message}`);
}

const ajv = new Ajv();
console.log('╭ 📝 Registering schemas');
for await (const schemaFile of fs.glob('src/schemas/*.schema.json')) {
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
  const schemaId = path.basename(schemaFile);
  console.log('├', schemaId);
  ajv.addSchema(schema, schemaId);
}
console.log('╰ Done!\n');

// Collect all category slugs for duplicate detection
console.log('╭ 📦 Collecting category slugs');
const categorySlugs = new Set<string>();
for await (const categoryFile of fs.glob('src/data/categories/*.json')) {
  const slug = path.basename(categoryFile, '.json');
  categorySlugs.add(slug);
}
console.log(`├ Found ${categorySlugs.size} categories`);
console.log('╰ Done!\n');

console.log('╭ 🔍 Validating data files...');
for await (const sourceFile of fs.glob('src/data/**/*.json')) {
  let data: DataWithSchema;
  try {
    data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
  } catch (error) {
    fail(`Invalid JSON in ${sourceFile} ${(error as Error).message}`);
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
  const validate = ajv.getSchema(path.basename(data.$schema));

  if (!validate) {
    fail(`Schema not found for ${sourceFile} at ${data.$schema ?? 'undefined'}`);
    continue;
  }

  const isValid = validate(data);
  if (!isValid) {
    fail(`Validation failed for ${sourceFile}`);
    console.error(validate.errors);
  }

  // Reformat JSON file to ensure consistent formatting
  const currentContent = await fs.readFile(sourceFile, 'utf-8');
  const jsonContent = JSON.stringify(data, null, 2);
  const prettierConfig = await resolveConfig(sourceFile);
  const formattedContent = await format(jsonContent, {
    ...prettierConfig,
    parser: 'json',
    filepath: sourceFile,
  });
  if (currentContent !== formattedContent) {
    change(`Reformatting ${path.basename(sourceFile)}`);
    await fs.writeFile(sourceFile, formattedContent);
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

  // Ensure no ingredient file has the same name as a category
  if (schemaPath === 'schemas/ingredient.schema.json') {
    const ingredientSlug = slugify(data.name);
    if (categorySlugs.has(ingredientSlug)) {
      fail(
        `Ingredient "${data.name}" duplicates category "${ingredientSlug}". ` +
          `Remove the ingredient file and use type: "category" in recipes instead.`,
      );
    }
  }

  if (
    schemaPath === 'schemas/recipe.schema.json' ||
    schemaPath === 'schemas/ingredient.schema.json'
  ) {
    const { ingredients = [], categories = [] } = data;
    let fileModified = false;

    // Auto-fix ingredients that should be categories
    for (const ingredient of ingredients) {
      const ingredientSlug = slugify(ingredient.name);
      if (ingredient.type !== 'category' && categorySlugs.has(ingredientSlug)) {
        change(
          `Fixing "${ingredient.name}" in ${path.basename(sourceFile)}: ` +
            `type "${ingredient.type}" → "category"`,
        );
        ingredient.type = 'category';
        fileModified = true;
      }
    }

    if (fileModified) {
      await writeJSON(sourceFile, data);
    }

    // Make sure all ingredients listed somewhere have a metadata file
    for (const ingredient of ingredients) {
      if (ingredient.type === 'category') {
        const categoryPath = path.join(
          'src/data/categories',
          `${slugify(ingredient.name)}.json`,
        );
        if (await fileExists(categoryPath)) continue;

        fail(`Ingredient file not found ${categoryPath}`);
        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(APP_ROOT, 'schemas/category.schema.json'),
          ),
          name: ingredient.name,
          categoryType: 'FIXME',
        });
      } else {
        const ingredientPath = path.join(
          'src/data/ingredients',
          ingredient.type,
          `${slugify(ingredient.name)}.json`,
        );
        if (await fileExists(ingredientPath)) continue;

        fail(`Ingredient file not found ${ingredientPath}`);
        await writeJSON(ingredientPath, {
          $schema: path.relative(
            path.dirname(ingredientPath),
            path.resolve(APP_ROOT, 'schemas/ingredient.schema.json'),
          ),
          name: ingredient.name,
          type: ingredient.type,
        });
      }
    }

    // Make sure all categories have a metadata file
    for (const category of categories) {
      const categoryPath = path.join('src/data/categories', `${slugify(category)}.json`);
      if (await fileExists(categoryPath)) continue;

      fail(`Category file not found ${categoryPath}`);
      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(APP_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: data.type ?? 'FIXME',
      });
    }
  }

  // Make sure there's all parent categories have their metadata files
  if (schemaPath === 'schemas/category.schema.json') {
    for (const category of data.parents ?? []) {
      const categoryPath = path.join('src/data/categories', `${slugify(category)}.json`);
      if (await fileExists(categoryPath)) continue;

      fail(`Category file not found ${categoryPath}`);
      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(APP_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: 'FIXME',
      });
    }
  }
}

console.log(exitCode > 0 ? '╰ ❌ Validation failed!' : '╰ ✅ Done!');
process.exit(exitCode);
