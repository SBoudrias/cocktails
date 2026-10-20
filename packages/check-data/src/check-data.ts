#!/usr/bin/env -S node --no-warnings

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compareIngredients,
  type SortableIngredient,
} from '@cocktails/ingredient-sorting';
import slugify from '@sindresorhus/slugify';
import {
  isApprovedOverlap,
  normalizeName,
  validateApprovedOverlaps,
} from './approved-overlaps.ts';
import { checkAttributions } from './attributions.ts';
import { checkAuthorSources } from './author-sources.ts';
import { findInconsistentBarLocations, findSimilarBarNames } from './bar-locations.ts';
import { findRedundantCategoryPairs } from './category-similarity.ts';
import { logger } from './cli-util.ts';
import { loadDataContext } from './data-context.ts';
import { checkFileIntegrity } from './file-integrity.ts';
import { findFloatingIngredients } from './floating-ingredients.ts';
import { findSimilarIngredientPairs } from './ingredient-similarity.ts';
import { areSimilarNames } from './name-similarity.ts';
import { APPROVED_OVERLAPS_PATH, PACKAGE_ROOT, REPO_ROOT } from './paths.ts';
import { checkRefs } from './refs.ts';
import { createReport, type Report } from './report.ts';
import { loadSchemas } from './schemas.ts';
import type { DataWithSchema, Ingredient } from './types.ts';
import { createWriteJSON } from './write-json.ts';

const startTime = performance.now();

function isChapterFolder(folder: string): boolean {
  return /^\d+_.+$/.test(folder);
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

// Schema formatter - auto-infers key ordering from registered schemas
const { report, getExitCode } = createReport();
const fail: Report['fail'] = report.fail;

const { ajv, formatter } = await loadSchemas();
const writeJSON = createWriteJSON({ formatter, report });

const ctx = await loadDataContext({ writeJSON, report });
const {
  categorySlugs,
  canonicalNames,
  categoryTypes,
  barLocationUsages,
  categoryCanonicalNames,
  allCategories,
  ingredientFolders,
  ingredientFiles,
  ingredients,
  ingredientNames,
  ingredientFilesByName,
  barNameCasings,
  approvedOverlaps,
  authorNameUsages,
  untrackedRefChannels,
  referencedIngredientSlugs,
} = ctx;

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

    // Auto-fix category names on ingredient files to match the canonical
    // category names, so variants like "Tequila Blanco" vs "Tequila (Blanco)"
    // or "Orange liqueur" vs "Orange Liqueur" don't accumulate.
    if (schemaPath === 'schemas/ingredient.schema.json') {
      for (const [i, category] of categories.entries()) {
        const canonical = categoryCanonicalNames.get(slugify(category));
        if (canonical && canonical !== category) {
          logger.change(
            `Fixing category "${category}" → "${canonical}" in ${path.basename(sourceFile)}`,
          );
          categories[i] = canonical;
          fileModified = true;
        }
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
      const ingredientSlug = slugify(ingredient.name);

      if (ingredient.type === 'category') {
        if (categorySlugs.has(ingredientSlug)) continue;

        const categoryPath = path.join(
          PACKAGE_ROOT,
          'data/categories',
          `${ingredientSlug}.json`,
        );

        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
          ),
          name: ingredient.name,
          categoryType: 'FIXME',
        });
        categorySlugs.add(ingredientSlug);
        fail(`Created ${categoryPath} - review and set categoryType`);
      } else {
        referencedIngredientSlugs.add(ingredientSlug);

        // Check if the ingredient exists in a different type folder
        const existingFolderType = ingredientFolders.get(ingredientSlug);
        if (existingFolderType === ingredient.type) continue;

        if (existingFolderType) {
          fail(
            `Ingredient "${ingredient.name}" in ${path.basename(sourceFile)} ` +
              `has type "${ingredient.type}" but the ingredient file is in folder "${existingFolderType}". ` +
              `Use type: "${existingFolderType}" in the recipe.`,
          );
          continue;
        }

        const ingredientPath = path.join(
          PACKAGE_ROOT,
          'data/ingredients',
          ingredient.type,
          `${ingredientSlug}.json`,
        );

        await writeJSON(ingredientPath, {
          $schema: path.relative(
            path.dirname(ingredientPath),
            path.resolve(PACKAGE_ROOT, 'schemas/ingredient.schema.json'),
          ),
          name: ingredient.name,
          type: ingredient.type,
        });
        ingredientFolders.set(ingredientSlug, ingredient.type);
        ingredientFiles.set(ingredientSlug, ingredientPath);
        fail(`Created ${ingredientPath} - review and add details if needed`);
      }
    }

    // Make sure all categories have a metadata file
    for (const category of categories) {
      const categorySlug = slugify(category);
      if (categorySlugs.has(categorySlug)) continue;

      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${categorySlug}.json`,
      );

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: data.type ?? 'FIXME',
      });
      categorySlugs.add(categorySlug);
      fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }

  // Make sure there's all parent categories have their metadata files
  if (schemaPath === 'schemas/category.schema.json') {
    let fileModified = false;

    // Auto-fix parent names to match the canonical category names
    const parents = data.parents ?? [];
    for (const [i, parent] of parents.entries()) {
      const canonical = categoryCanonicalNames.get(slugify(parent));
      if (canonical && canonical !== parent) {
        logger.change(
          `Fixing parent "${parent}" → "${canonical}" in ${path.basename(sourceFile)}`,
        );
        parents[i] = canonical;
        fileModified = true;
      }
    }

    if (fileModified) {
      await writeJSON(sourceFile, data);
    }

    for (const category of data.parents ?? []) {
      const categorySlug = slugify(category);
      if (categorySlugs.has(categorySlug)) continue;

      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${categorySlug}.json`,
      );

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: 'FIXME',
      });
      categorySlugs.add(categorySlug);
      fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }

  // Apply key ordering to all data files (silently)
  const originalJson = JSON.stringify(data, null, 2);
  const sortedData = formatter.format(data);
  const sortedJson = JSON.stringify(sortedData, null, 2);
  if (originalJson !== sortedJson) {
    await writeJSON(sourceFile, data);
  }
}
logger.footer('Done!');

logger.header('🛟 Checking for floating ingredients...');
for (const ingredient of findFloatingIngredients(
  ingredients,
  referencedIngredientSlugs,
)) {
  fail(
    `Floating ingredient "${ingredient.name}" in ${ingredient.filepath} is not referenced by any recipe`,
  );
}
logger.footer('Done!');

// Report refs pointing to channels that are not tracked sources
logger.header('📺 Checking youtube ref channels...');
for (const [channel, count] of untrackedRefChannels) {
  logger.warn(
    `Youtube ref channel "${channel}" (${count} ref(s)) is not a tracked youtube-channel source. ` +
      `The videos stay linked, but the channel gets no page or recipe listing. ` +
      `If this is a typo of a tracked channel, fix the slug.`,
  );
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

// Check for bars credited under the same name with inconsistent locations —
// two different locations, or the same name with and without one. Usually a
// drifted "City, ST" on one attribution; the approved overlaps registry hides
// names reviewed as genuinely multi-venue bars.
logger.header('📍 Checking bar locations...');
const approvedBarNames = new Set(
  (approvedOverlaps.bar ?? []).map((name) => normalizeName(name)),
);
for (const { name, variants } of findInconsistentBarLocations(barLocationUsages)) {
  if (approvedBarNames.has(normalizeName(name))) continue;

  const summary = variants
    .map(
      (variant) =>
        `"${variant.location ?? 'no location'}" (${variant.count} use(s), e.g. ${path.relative(REPO_ROOT, variant.exampleFile)})`,
    )
    .join(', ');
  logger.warn(
    `Bar "${name}" is credited with inconsistent locations:`,
    summary,
    `Standardize the location across attributions and entity files. ` +
      `If these are genuinely different venues, register the name in the "bar" list of approved-overlaps.json.`,
  );
}
logger.footer('Done!');

// Check for bar names that look like one venue recorded at two precisions —
// one name contained inside the other plus one or two extra words. Renames
// and short-form credits ("Caribe Hilton" vs "Caribe Hilton Hotel") look
// like this; the approved overlaps registry hides reviewed pairs.
logger.header('📍 Checking for similar bar names...');
for (const { shortName, longName, extras } of findSimilarBarNames(barLocationUsages)) {
  if (isApprovedOverlap(approvedOverlaps, 'bar', shortName, longName)) continue;

  logger.warn(
    `Similar bar names — possible duplicate:`,
    `"${shortName}" vs "${longName}" (adds: ${extras.join(', ')})`,
    `Review whether these are the same venue recorded at two precisions. ` +
      `If genuinely different venues, register both names in the "bar" list of approved-overlaps.json.`,
  );
}
logger.footer('Done!');

// Validate the approved overlaps registry against the names actually in use.
for (const message of validateApprovedOverlaps(
  approvedOverlaps,
  new Map([
    ...Array.from(
      authorNameUsages.keys(),
      (name) => [normalizeName(name), name] as const,
    ),
    ...Array.from(barNameCasings.keys(), (name) => [normalizeName(name), name] as const),
    ...ingredientNames.map((name) => [normalizeName(name), name] as const),
  ]),
)) {
  logger.warn(`Approved overlaps registry: ${message}`);
}

// Check for similar author and bar names (possible misspellings)
logger.header('👥 Checking for similar author and bar names...');

const authorNames = Array.from(authorNameUsages.keys());
for (const [i, a] of authorNames.entries()) {
  for (const b of authorNames.slice(i + 1)) {
    if (areSimilarNames(a, b) && !isApprovedOverlap(approvedOverlaps, 'author', a, b)) {
      const filesA = authorNameUsages.get(a)!;
      const filesB = authorNameUsages.get(b)!;
      logger.warn(
        `Similar author names — possible misspelling:`,
        `"${a}" (${filesA.length} recipe(s)) vs "${b}" (${filesB.length} recipe(s))`,
        `Review and standardize spelling. If genuinely different people, this is a false positive.`,
      );
    }
  }
}

const barKeys = Array.from(barNameCasings.keys());
for (const [i, a] of barKeys.entries()) {
  for (const b of barKeys.slice(i + 1)) {
    if (areSimilarNames(a, b) && !isApprovedOverlap(approvedOverlaps, 'bar', a, b)) {
      const casingsA = barNameCasings.get(a)!;
      const casingsB = barNameCasings.get(b)!;
      const displayA = Array.from(casingsA.keys())[0] ?? a;
      const displayB = Array.from(casingsB.keys())[0] ?? b;
      const countA = Array.from(casingsA.values()).flat().length;
      const countB = Array.from(casingsB.values()).flat().length;
      logger.warn(
        `Similar bar names — possible misspelling:`,
        `"${displayA}" (${countA} recipe(s)) vs "${displayB}" (${countB} recipe(s))`,
        `Review and standardize spelling. If genuinely different bars, this is a false positive.`,
      );
    }
  }
}

logger.footer('Done!');

// Check for similar ingredient names (possible misspellings)
logger.header('🥃 Checking for similar ingredient names...');

for (const { a, b } of findSimilarIngredientPairs(ingredientNames)) {
  if (isApprovedOverlap(approvedOverlaps, 'ingredient', a, b)) continue;
  const fileA = path.relative(REPO_ROOT, ingredientFilesByName.get(a)!);
  const fileB = path.relative(REPO_ROOT, ingredientFilesByName.get(b)!);
  const overlapsPath = path.relative(REPO_ROOT, APPROVED_OVERLAPS_PATH);
  fail(
    `Similar ingredient names — possible misspelling: "${a}" (${fileA}) vs "${b}" (${fileB}). ` +
      `Review and standardize spelling. If genuinely different ingredients, register both names in the "ingredient" list of ${overlapsPath} to allow this overlap.`,
  );
}

logger.footer('Done!');

// Check for similar category names (same product registered under two names)
logger.header('🏷️ Checking for redundant category names...');

for (const { a, b } of findRedundantCategoryPairs(allCategories)) {
  logger.warn(
    `Similar category names — possible duplicate:`,
    `"${a.name}" (${path.relative(REPO_ROOT, a.filepath)}) vs "${b.name}" (${path.relative(REPO_ROOT, b.filepath)}).`,
    `Both are ${a.categoryType} categories. Merge them into one, or — for a generic parent grouping substitution-friendly variants (e.g. "Falernum" → "Falernum liqueur") — declare the relationship with "parents".`,
  );
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

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
const exitCode = getExitCode();
if (exitCode > 0) {
  logger.failure(`❌ Validation failed! ⏱️ ${elapsed}s`);
} else {
  logger.success(`All good! ⏱️ ${elapsed}s`);
}
process.exit(exitCode);
