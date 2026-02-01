#!/usr/bin/env -S node --no-warnings

import {
  compareIngredients,
  type SortableIngredient,
} from '@cocktails/ingredient-sorting';
import slugify from '@sindresorhus/slugify';
import Ajv from 'ajv/dist/2020.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isChapterFolder } from '../src/modules/chapters.ts';
import { logger } from './cli-util.ts';
import { createKeyOrdersRegistry, sortObjectKeys } from './schema-key-orders.ts';

const startTime = performance.now();
const PACKAGE_ROOT = path.join(import.meta.dirname, '..');

interface Ingredient extends SortableIngredient {
  type: string;
  name: string;
  brix?: number;
}

interface Attribution {
  relation: string;
  source: string;
  location?: string;
}

interface DataWithSchema {
  $schema: string;
  name: string;
  type?: string;
  ingredients?: Ingredient[];
  attributions?: Attribution[];
  categories?: string[];
  parents?: string[];
}

function addCategoryType(
  ingredient: Ingredient,
  categoryTypes: Map<string, string>,
): SortableIngredient {
  return {
    type: ingredient.type,
    categoryType:
      ingredient.type === 'category'
        ? categoryTypes.get(slugify(ingredient.name))
        : undefined,
    quantity: ingredient.quantity!,
    technique: ingredient.technique,
  };
}

function sortRecipeIngredients(
  ingredients: Ingredient[],
  categoryTypes: Map<string, string>,
): Ingredient[] {
  return ingredients.toSorted((a, b) => {
    if (!a.quantity || !b.quantity) return 0;
    return compareIngredients(
      addCategoryType(a, categoryTypes),
      addCategoryType(b, categoryTypes),
    );
  });
}

// Key ordering registry - populated during schema loading
const { keyOrders, registerSchema } = createKeyOrdersRegistry();

async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function writeJSON(filepath: string, data: object): Promise<void> {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  const sortedData = sortObjectKeys(data, keyOrders);
  const jsonContent = JSON.stringify(sortedData, null, 2) + '\n';
  await fs.writeFile(filepath, jsonContent);
}

let exitCode = 0;
function fail(message: string): void {
  logger.error(message);
  exitCode = 1;
}

const ajv = new Ajv();
logger.header('📝 Registering schemas');
const schemasGlob = path.join(PACKAGE_ROOT, 'schemas/*.schema.json');
for await (const schemaFile of fs.glob(schemasGlob)) {
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));
  const schemaId = path.basename(schemaFile);
  logger.item(schemaId);
  ajv.addSchema(schema, schemaId);

  // Extract key ordering from schema
  registerSchema(schemaId, schema);
}
logger.footer('Done!');

// Collect all category slugs and canonical names for duplicate detection and name matching
logger.header('📦 Collecting category and ingredient data');
const categorySlugs = new Set<string>();
const canonicalNames = new Map<string, string>(); // slug -> canonical name
const categoryTypes = new Map<string, string>(); // slug -> categoryType

const categoriesGlob = path.join(PACKAGE_ROOT, 'data/categories/*.json');
for await (const categoryFile of fs.glob(categoriesGlob)) {
  const slug = path.basename(categoryFile, '.json');
  categorySlugs.add(slug);
  const data = JSON.parse(await fs.readFile(categoryFile, 'utf-8'));
  canonicalNames.set(slugify(data.name), data.name);
  if (data.categoryType) {
    categoryTypes.set(slugify(data.name), data.categoryType);
  }
}
logger.item(`Found ${categorySlugs.size} categories`);

const ingredientsGlob = path.join(PACKAGE_ROOT, 'data/ingredients/**/*.json');
for await (const ingredientFile of fs.glob(ingredientsGlob)) {
  const data = JSON.parse(await fs.readFile(ingredientFile, 'utf-8'));
  canonicalNames.set(slugify(data.name), data.name);
}
logger.item(`Collected ${canonicalNames.size} canonical names`);
logger.footer('Done!');

// Track bar names for case-insensitive duplicate detection
// Maps lowercase name -> Map of exact casing -> list of files using that casing
const barNameCasings = new Map<string, Map<string, string[]>>();

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

  if (!data.$schema) {
    fail(`$schema not defined in ${sourceFile}`);
    continue;
  }

  const schemaPath = path.relative(
    path.join(PACKAGE_ROOT, 'data'),
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
      logger.change(`Renaming ${path.basename(sourceFile)} to ${path.basename(newPath)}`);
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

  // Collect bar attributions for case consistency check
  if (schemaPath === 'schemas/recipe.schema.json') {
    for (const attribution of data.attributions ?? []) {
      if (attribution.relation === 'bar') {
        const lowerName = attribution.source.toLowerCase();
        if (!barNameCasings.has(lowerName)) {
          barNameCasings.set(lowerName, new Map());
        }
        const casings = barNameCasings.get(lowerName)!;
        if (!casings.has(attribution.source)) {
          casings.set(attribution.source, []);
        }
        casings.get(attribution.source)!.push(sourceFile);
      }

      // Check for combined author names (should be separate attributions)
      // We require 4+ words to avoid false positives on valid names like "Make and Drink".
      // This means rare cases like "Cher and Madonna" (3 words) won't be caught,
      // but most combined authors have at least one full name (e.g. "Cher and John Smith").
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        const hasConnector = / (and|&) /i.test(attribution.source);
        const wordCount = attribution.source.split(/\s+/).length;
        if (hasConnector && wordCount >= 4) {
          fail(
            `Combined authors in ${path.basename(sourceFile)}: "${attribution.source}". ` +
              `Split into separate attributions, one per person.`,
          );
        }
      }
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
        logger.change(
          `Fixing "${ingredient.name}" in ${path.basename(sourceFile)}: ` +
            `type "${ingredient.type}" → "category"`,
        );
        ingredient.type = 'category';
        fileModified = true;
      }
    }

    // Auto-fix ingredient name capitalization to match canonical names
    for (const ingredient of ingredients) {
      const ingredientSlug = slugify(ingredient.name);
      const canonical = canonicalNames.get(ingredientSlug);
      if (canonical && canonical !== ingredient.name) {
        logger.change(
          `Fixing "${ingredient.name}" → "${canonical}" in ${path.basename(sourceFile)}`,
        );
        ingredient.name = canonical;
        fileModified = true;
      }
    }

    // Sort recipe ingredients to match app display order
    if (schemaPath === 'schemas/recipe.schema.json' && ingredients.length > 1) {
      const sortedIngredients = sortRecipeIngredients(ingredients, categoryTypes);
      const ingredientsChanged = ingredients.some(
        (ing, i) => ing.name !== sortedIngredients[i]?.name,
      );
      if (ingredientsChanged) {
        data.ingredients = sortedIngredients;
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
          PACKAGE_ROOT,
          'data/categories',
          `${slugify(ingredient.name)}.json`,
        );
        if (await fileExists(categoryPath)) continue;

        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
          ),
          name: ingredient.name,
          categoryType: 'FIXME',
        });
        fail(`Created ${categoryPath} - review and set categoryType`);
      } else {
        const ingredientPath = path.join(
          PACKAGE_ROOT,
          'data/ingredients',
          ingredient.type,
          `${slugify(ingredient.name)}.json`,
        );
        if (await fileExists(ingredientPath)) continue;

        await writeJSON(ingredientPath, {
          $schema: path.relative(
            path.dirname(ingredientPath),
            path.resolve(PACKAGE_ROOT, 'schemas/ingredient.schema.json'),
          ),
          name: ingredient.name,
          type: ingredient.type,
        });
        fail(`Created ${ingredientPath} - review and add details if needed`);
      }
    }

    // Make sure all categories have a metadata file
    for (const category of categories) {
      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${slugify(category)}.json`,
      );
      if (await fileExists(categoryPath)) continue;

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: data.type ?? 'FIXME',
      });
      fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }

  // Make sure there's all parent categories have their metadata files
  if (schemaPath === 'schemas/category.schema.json') {
    for (const category of data.parents ?? []) {
      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${slugify(category)}.json`,
      );
      if (await fileExists(categoryPath)) continue;

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: 'FIXME',
      });
      fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }

  // Apply key ordering to all data files (silently)
  const originalJson = JSON.stringify(data, null, 2);
  const sortedData = sortObjectKeys(data, keyOrders);
  const sortedJson = JSON.stringify(sortedData, null, 2);
  if (originalJson !== sortedJson) {
    await writeJSON(sourceFile, data);
  }
}
logger.footer('Done!');

// Check for inconsistent bar name casing
logger.header('🍸 Checking bar name consistency...');
for (const [, casings] of barNameCasings) {
  if (casings.size > 1) {
    const variants = Array.from(casings.entries())
      .map(([casing, files]) => `"${casing}" in ${files.length} file(s)`)
      .join(', ');
    fail(`Bar name has inconsistent casing: ${variants}`);
  }
}
logger.footer('Done!');

// Validate book chapter structure
logger.header('📚 Validating book chapter structure...');
const bookRoot = path.join(PACKAGE_ROOT, 'data/recipes/book');
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
        fail(
          `Book "${bookSlug}": Directory "${entry}" does not match chapter pattern (##_Name)`,
        );
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
logger.footer('Done!');

// Trigger reformatting once on all files for good measures
execSync(`yarn oxfmt`, { stdio: 'ignore' });

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
if (exitCode > 0) {
  logger.failure(`❌ Validation failed! ⏱️ ${elapsed}s`);
} else {
  logger.success(`All good! ⏱️ ${elapsed}s`);
}
process.exit(exitCode);
