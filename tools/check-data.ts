#!/usr/bin/env -S node --no-warnings

import slugify from '@sindresorhus/slugify';
import Ajv from 'ajv/dist/2020.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

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
  const jsonContent = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filepath, jsonContent);
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

console.log('╰ Done!\n');

// Validate book chapter structure
const CHAPTER_PATTERN = /^\d+_.+$/;

function isChapterFolder(name: string): boolean {
  return CHAPTER_PATTERN.test(name);
}

console.log('╭ 📚 Validating book chapter structure...');
const bookRoot = 'src/data/recipes/book';
for await (const bookSlug of await fs.readdir(bookRoot)) {
  const bookPath = path.join(bookRoot, bookSlug);
  const entries = await fs.readdir(bookPath);

  const flatRecipes: string[] = [];
  const chapterDirs: string[] = [];
  const recipeSlugs = new Map<string, string>(); // slug -> location for duplicate detection

  for (const entry of entries) {
    if (entry === '_source.json') continue;

    const entryPath = path.join(bookPath, entry);
    const stat = await fs.stat(entryPath);

    if (stat.isDirectory()) {
      // Validate chapter folder naming pattern
      if (!isChapterFolder(entry)) {
        fail(`Book "${bookSlug}": Directory "${entry}" does not match chapter pattern (##_Name)`);
        continue;
      }

      chapterDirs.push(entry);

      // Check for recipes in chapter
      const chapterEntries = await fs.readdir(entryPath);
      const chapterRecipes = chapterEntries.filter((f) => f.endsWith('.json'));

      if (chapterRecipes.length === 0) {
        fail(`Book "${bookSlug}": Chapter "${entry}" is empty`);
      }

      // Check for duplicate recipe slugs
      for (const recipeFile of chapterRecipes) {
        const recipeSlug = path.basename(recipeFile, '.json');
        const existingLocation = recipeSlugs.get(recipeSlug);
        if (existingLocation) {
          fail(
            `Book "${bookSlug}": Duplicate recipe "${recipeSlug}" ` +
              `found in "${entry}" and "${existingLocation}"`,
          );
        } else {
          recipeSlugs.set(recipeSlug, entry);
        }
      }
    } else if (entry.endsWith('.json')) {
      flatRecipes.push(entry);

      // Check for duplicate recipe slugs
      const recipeSlug = path.basename(entry, '.json');
      const existingLocation = recipeSlugs.get(recipeSlug);
      if (existingLocation) {
        fail(
          `Book "${bookSlug}": Duplicate recipe "${recipeSlug}" ` +
            `found in root and "${existingLocation}"`,
        );
      } else {
        recipeSlugs.set(recipeSlug, 'root');
      }
    }
  }

  // All-or-nothing: if chapters exist, all recipes must be in chapters
  if (chapterDirs.length > 0 && flatRecipes.length > 0) {
    fail(
      `Book "${bookSlug}": Has chapter directories but also has flat recipe files. ` +
        `Move all recipes into chapter directories: ${flatRecipes.join(', ')}`,
    );
  }
}

// Trigger reformatting once on all files for good measures
try {
  execSync(`yarn oxfmt`, { stdio: 'ignore' });
} catch {
  // oxfmt may not be installed/available, ignore the error
}

console.log(exitCode > 0 ? '╰ ❌ Validation failed!' : '╰ ✅ Done!');
process.exit(exitCode);
