import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { ApprovedOverlaps } from '../checks/report/approved-overlaps.ts';
import type { BarLocationUsage } from '../checks/report/bar-locations.ts';
import {
  findMissingEntities,
  type RecipeAttributions,
} from '../checks/report/missing-entities.ts';
import { logger } from '../cli-util.ts';
import { readDataFile } from '../infra/file-cache.ts';
import { APPROVED_OVERLAPS_PATH, PACKAGE_ROOT } from '../infra/paths.ts';
import { report } from '../infra/report.ts';
import { writeJSON } from '../infra/write-json.ts';
import { normalizeCategoryCasing } from './category-casing.ts';

interface Attribution {
  relation: string;
  source: string;
  location?: string;
}

interface CategoryData {
  name: string;
  categoryType?: string;
  substitutable?: boolean;
  parents?: string[];
}

interface IngredientData {
  name: string;
  type: string;
}

interface BarEntity {
  name: string;
  location?: string;
}

interface CollectedCategory {
  name: string;
  categoryType: string;
  substitutable?: boolean;
  parents?: string[];
  filepath: string;
}

interface IngredientRef {
  name: string;
  type: string;
  slug: string;
  filepath: string;
}

/**
 * The mutable data indexes every check reads and writes: canonical names,
 * slugs, usage maps. Filled once by {@link loadContext} before the per-file
 * pass; the creation autofixes mutate these maps mid-run so later files see
 * the new values.
 */
export interface DataContext {
  /** All category slugs, including ones created as stubs during the run. */
  categorySlugs: Set<string>;
  /** slug -> canonical name, for ingredients and categories alike. */
  canonicalNames: Map<string, string>;
  /** slug -> categoryType, for recipe ingredient sorting. */
  categoryTypes: Map<string, string>;
  /** Slugs of tracked youtube channels, to validate ref channel fields. */
  youtubeChannelSlugs: Set<string>;
  /** Source slugs per type, to validate the sources refs on author entities. */
  sourceSlugsByType: Map<string, Set<string>>;
  authorEntitySlugs: Set<string>;
  barEntitySlugs: Set<string>;
  /** Bar name/location usages from entity files and recipe attributions. */
  barLocationUsages: BarLocationUsage[];
  /** slug -> canonical category name, for reference canonicalization. */
  categoryCanonicalNames: Map<string, string>;
  /** Categories with a categoryType, for the redundancy check. */
  allCategories: CollectedCategory[];
  /** ingredient slug -> folder type. */
  ingredientFolders: Map<string, string>;
  /** ingredient slug -> filepath. */
  ingredientFiles: Map<string, string>;
  /** Every ingredient file, for the floating-ingredient check. */
  ingredients: IngredientRef[];
  ingredientNames: string[];
  ingredientFilesByName: Map<string, string>;
  /** lowercase bar name -> casing -> recipe files, for casing checks. */
  barNameCasings: Map<string, Map<string, string[]>>;
  approvedOverlaps: ApprovedOverlaps;
  /** author name -> recipe files, for similarity checks. */
  authorNameUsages: Map<string, string[]>;
  /** ref channel slug -> ref count, for the untracked-channel report. */
  untrackedRefChannels: Map<string, number>;
  /** ingredient slugs referenced by at least one recipe. */
  referencedIngredientSlugs: Set<string>;
}

/** The single shared context; every check imports this object. */
export const ctx: DataContext = {
  categorySlugs: new Set<string>(),
  canonicalNames: new Map<string, string>(),
  categoryTypes: new Map<string, string>(),
  youtubeChannelSlugs: new Set<string>(),
  sourceSlugsByType: new Map<string, Set<string>>(),
  authorEntitySlugs: new Set<string>(),
  barEntitySlugs: new Set<string>(),
  barLocationUsages: [],
  categoryCanonicalNames: new Map<string, string>(),
  allCategories: [],
  ingredientFolders: new Map<string, string>(),
  ingredientFiles: new Map<string, string>(),
  ingredients: [],
  ingredientNames: [],
  ingredientFilesByName: new Map<string, string>(),
  barNameCasings: new Map<string, Map<string, string[]>>(),
  approvedOverlaps: { author: [], bar: [], ingredient: [] },
  authorNameUsages: new Map<string, string[]>(),
  untrackedRefChannels: new Map<string, number>(),
  referencedIngredientSlugs: new Set<string>(),
};

/**
 * Collects every data index the checks need: youtube channels and sources,
 * author/bar entities (failing on credits with no entity file), categories
 * (with sentence-casing autofix), and ingredients.
 */
export async function loadContext(): Promise<void> {
  const {
    categorySlugs,
    canonicalNames,
    categoryTypes,
    youtubeChannelSlugs,
    sourceSlugsByType,
    authorEntitySlugs,
    barEntitySlugs,
    barLocationUsages,
    categoryCanonicalNames,
    allCategories,
    ingredientFolders,
    ingredientFiles,
    ingredients,
  } = ctx;

  logger.header('📦 Collecting category and ingredient data');
  const [
    youtubeEntries,
    bookEntries,
    podcastEntries,
    authorFiles,
    barFiles,
    recipeFiles,
    categoryFiles,
    ingredientFilesList,
    approvedOverlapsRaw,
  ] = await Promise.all([
    fs.readdir(path.join(PACKAGE_ROOT, 'data/recipes/youtube-channel'), {
      withFileTypes: true,
    }),
    fs.readdir(path.join(PACKAGE_ROOT, 'data/recipes/book'), { withFileTypes: true }),
    fs.readdir(path.join(PACKAGE_ROOT, 'data/recipes/podcast'), { withFileTypes: true }),
    Array.fromAsync(fs.glob(path.join(PACKAGE_ROOT, 'data/authors/*.json'))),
    Array.fromAsync(fs.glob(path.join(PACKAGE_ROOT, 'data/bars/*.json'))),
    Array.fromAsync(fs.glob(path.join(PACKAGE_ROOT, 'data/recipes/**/*.json'))),
    Array.fromAsync(fs.glob(path.join(PACKAGE_ROOT, 'data/categories/*.json'))),
    Array.fromAsync(fs.glob(path.join(PACKAGE_ROOT, 'data/ingredients/**/*.json'))),
    fs.readFile(APPROVED_OVERLAPS_PATH, 'utf8').then(
      (content) => ({ ok: true as const, content }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
  ]);

  const [barRawContents, recipeRawContents, categoryRawContents, ingredientRawContents] =
    await Promise.all([
      Promise.all(barFiles.map(readDataFile)),
      Promise.all(recipeFiles.map(readDataFile)),
      Promise.all(categoryFiles.map(readDataFile)),
      Promise.all(ingredientFilesList.map(readDataFile)),
    ]);

  for (const entry of youtubeEntries) {
    if (entry.isDirectory()) youtubeChannelSlugs.add(entry.name);
  }
  logger.item(`Found ${youtubeChannelSlugs.size} youtube channels`);

  sourceSlugsByType.set('youtube-channel', new Set(youtubeChannelSlugs));
  for (const [sourceType, entries] of [
    ['book', bookEntries],
    ['podcast', podcastEntries],
  ] as const) {
    const slugs = new Set<string>();
    for (const entry of entries) {
      if (entry.isDirectory()) slugs.add(entry.name);
    }
    sourceSlugsByType.set(sourceType, slugs);
  }

  // Entity files backing the author/bar list pages. Every attribution source
  // must resolve to one — entities are credited in recipes before anything is
  // known about them, so a credit with no file fails the run with the exact
  // file to add (name-only is fine; links and descriptions are added only
  // once verified, never generated here).
  logger.header('👥 Collecting author and bar entities');
  for (const entityFile of authorFiles) {
    authorEntitySlugs.add(path.basename(entityFile, '.json'));
  }
  for (const entityFile of barFiles) {
    barEntitySlugs.add(path.basename(entityFile, '.json'));
  }

  for (const [i, barFile] of barFiles.entries()) {
    const bar: BarEntity = JSON.parse(barRawContents[i]!);
    barLocationUsages.push({ name: bar.name, location: bar.location, filepath: barFile });
  }

  const recipeAttributions: RecipeAttributions[] = recipeFiles.map((recipeFile, i) => {
    const recipe: { attributions?: Attribution[] } = JSON.parse(recipeRawContents[i]!);
    return {
      filepath: recipeFile,
      attributions: recipe.attributions ?? [],
    };
  });

  // Missing entities fail the run instead of being created silently: writing
  // name-only stubs on every run left generated files lying around on clean
  // trees, and the pre-commit hook swept them into unrelated commits (#549,
  // #551). The fail message names the exact file to add — name-only is fine,
  // richer fields (links, description, sources) only once verified.
  const missingEntities = findMissingEntities(recipeAttributions, {
    authors: authorEntitySlugs,
    bars: barEntitySlugs,
  });
  for (const entity of missingEntities.values()) {
    (entity.kind === 'author' ? authorEntitySlugs : barEntitySlugs).add(entity.slug);
  }
  logger.item(`Found ${authorEntitySlugs.size} authors, ${barEntitySlugs.size} bars`);
  for (const entity of missingEntities.values()) {
    report.fail(
      `Missing ${entity.kind} entity for the attribution(s) in ${entity.recipeFiles.join(', ')}: ` +
        `create data/${entity.kind}s/${entity.slug}.json, e.g. ` +
        `{"$schema": "../../schemas/${entity.kind}.schema.json", "name": "..."}`,
    );
  }
  logger.footer('Done!');

  for (const [i, categoryFile] of categoryFiles.entries()) {
    const slug = path.basename(categoryFile, '.json');
    categorySlugs.add(slug);
    const data: CategoryData = JSON.parse(categoryRawContents[i]!);

    // Auto-fix category names to the sentence-case convention. Casing changes
    // don't affect the slug, so references resolve and get canonicalized by
    // the per-file pass below.
    const normalizedCasing = normalizeCategoryCasing(data.name);
    if (normalizedCasing !== data.name) {
      logger.change(
        `Fixing category name casing "${data.name}" → "${normalizedCasing}" in ${path.basename(categoryFile)}`,
      );
      data.name = normalizedCasing;
      await writeJSON(categoryFile, data);
    }

    canonicalNames.set(slugify(data.name), data.name);
    categoryCanonicalNames.set(slugify(data.name), data.name);
    if (data.categoryType) {
      categoryTypes.set(slugify(data.name), data.categoryType);
      allCategories.push({
        name: data.name,
        categoryType: data.categoryType,
        substitutable: data.substitutable,
        parents: data.parents,
        filepath: categoryFile,
      });
    }
  }
  logger.item(`Found ${categorySlugs.size} categories`);

  for (const [i, ingredientFile] of ingredientFilesList.entries()) {
    const data: IngredientData = JSON.parse(ingredientRawContents[i]!);
    const folderType = path.basename(path.dirname(ingredientFile));
    const ingredientSlug = slugify(data.name);

    const existingIngredientFile = ingredientFiles.get(ingredientSlug);
    if (existingIngredientFile) {
      report.fail(
        `Duplicate ingredient slug "${ingredientSlug}" in ${ingredientFile} and ${existingIngredientFile}`,
      );
      continue;
    }

    canonicalNames.set(ingredientSlug, data.name);
    ingredientFolders.set(ingredientSlug, folderType);
    ingredientFiles.set(ingredientSlug, ingredientFile);
    ingredients.push({
      name: data.name,
      type: data.type,
      slug: ingredientSlug,
      filepath: ingredientFile,
    });
  }
  logger.item(`Collected ${canonicalNames.size} canonical names`);
  logger.footer('Done!');

  // Names of authors and bars known to be valid, so their similar-name
  // overlaps are suppressed. Loaded from packages/data/approved-overlaps.json.
  try {
    if (!approvedOverlapsRaw.ok) throw approvedOverlapsRaw.error;
    ctx.approvedOverlaps = JSON.parse(approvedOverlapsRaw.content);
  } catch (error) {
    report.fail(`Could not read approved overlaps registry: ${(error as Error).message}`);
  }

  ctx.ingredientNames = ingredients.map((ingredient) => ingredient.name);
  ctx.ingredientFilesByName = new Map(
    ingredients.map((ingredient) => [ingredient.name, ingredient.filepath] as const),
  );
}
