import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { ApprovedOverlaps } from '../checks/report/approved-overlaps.ts';
import type { BarLocationUsage } from '../checks/report/bar-locations.ts';
import { logger } from '../cli-util.ts';
import { APPROVED_OVERLAPS_PATH, PACKAGE_ROOT, REPO_ROOT } from '../infra/paths.ts';
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

export interface CollectedCategory {
  name: string;
  categoryType: string;
  parents?: string[];
  filepath: string;
}

export interface IngredientRef {
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
 * author/bar entities (creating name-only files for uncredited ones),
 * categories (with sentence-casing autofix), and ingredients.
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
  const youtubeChannelRoot = path.join(PACKAGE_ROOT, 'data/recipes/youtube-channel');
  for (const entry of await fs.readdir(youtubeChannelRoot)) {
    const entryStat = await fs.stat(path.join(youtubeChannelRoot, entry));
    if (entryStat.isDirectory()) youtubeChannelSlugs.add(entry);
  }
  logger.item(`Found ${youtubeChannelSlugs.size} youtube channels`);

  sourceSlugsByType.set('youtube-channel', new Set(youtubeChannelSlugs));
  for (const sourceType of ['book', 'podcast']) {
    const slugs = new Set<string>();
    const sourceRoot = path.join(PACKAGE_ROOT, `data/recipes/${sourceType}`);
    for (const entry of await fs.readdir(sourceRoot)) {
      if ((await fs.stat(path.join(sourceRoot, entry))).isDirectory()) slugs.add(entry);
    }
    sourceSlugsByType.set(sourceType, slugs);
  }

  // Entity files backing the author/bar list pages. Every attribution source
  // must resolve to one — entities are credited in recipes before anything is
  // known about them, so missing files are created name-only (links and
  // descriptions are added only once verified, never generated here).
  logger.header('👥 Collecting author and bar entities');
  for (const [entityDir, entitySlugs] of [
    ['authors', authorEntitySlugs],
    ['bars', barEntitySlugs],
  ] as const) {
    for await (const entityFile of fs.glob(
      path.join(PACKAGE_ROOT, `data/${entityDir}/*.json`),
    )) {
      entitySlugs.add(path.basename(entityFile, '.json'));
    }
  }

  for await (const barFile of fs.glob(path.join(PACKAGE_ROOT, 'data/bars/*.json'))) {
    const bar: BarEntity = JSON.parse(await fs.readFile(barFile, 'utf-8'));
    barLocationUsages.push({ name: bar.name, location: bar.location, filepath: barFile });
  }

  const createdEntities: string[] = [];
  for await (const recipeFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/recipes/**/*.json'),
  )) {
    const recipe: { attributions?: Attribution[] } = JSON.parse(
      await fs.readFile(recipeFile, 'utf-8'),
    );

    for (const attribution of recipe.attributions ?? []) {
      const isAuthor =
        attribution.relation === 'recipe author' || attribution.relation === 'adapted by';

      if (!isAuthor && attribution.relation !== 'bar') continue;

      const slug = isAuthor
        ? slugify(attribution.source)
        : slugify(`${attribution.source} ${attribution.location ?? ''}`);
      const entitySlugs = isAuthor ? authorEntitySlugs : barEntitySlugs;

      if (entitySlugs.has(slug)) continue;
      entitySlugs.add(slug);

      const entityDir = isAuthor ? 'authors' : 'bars';
      const entityPath = path.join(PACKAGE_ROOT, `data/${entityDir}`, `${slug}.json`);
      await writeJSON(entityPath, {
        $schema: path.relative(
          path.dirname(entityPath),
          path.resolve(
            PACKAGE_ROOT,
            `schemas/${isAuthor ? 'author' : 'bar'}.schema.json`,
          ),
        ),
        name: attribution.source,
        ...(attribution.relation === 'bar' && attribution.location
          ? { location: attribution.location }
          : {}),
      });
      createdEntities.push(path.relative(REPO_ROOT, entityPath));
    }
  }
  logger.item(`Found ${authorEntitySlugs.size} authors, ${barEntitySlugs.size} bars`);
  for (const entityPath of createdEntities) {
    logger.change(`Created ${entityPath}`);
  }
  logger.footer('Done!');

  for await (const categoryFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/categories/*.json'),
  )) {
    const slug = path.basename(categoryFile, '.json');
    categorySlugs.add(slug);
    const data: CategoryData = JSON.parse(await fs.readFile(categoryFile, 'utf-8'));

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
        parents: data.parents,
        filepath: categoryFile,
      });
    }
  }
  logger.item(`Found ${categorySlugs.size} categories`);

  for await (const ingredientFile of fs.glob(
    path.join(PACKAGE_ROOT, 'data/ingredients/**/*.json'),
  )) {
    const data: IngredientData = JSON.parse(await fs.readFile(ingredientFile, 'utf-8'));
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
    ctx.approvedOverlaps = JSON.parse(await fs.readFile(APPROVED_OVERLAPS_PATH, 'utf-8'));
  } catch (error) {
    report.fail(`Could not read approved overlaps registry: ${(error as Error).message}`);
  }

  ctx.ingredientNames = ingredients.map((ingredient) => ingredient.name);
  ctx.ingredientFilesByName = new Map(
    ingredients.map((ingredient) => [ingredient.name, ingredient.filepath] as const),
  );
}
