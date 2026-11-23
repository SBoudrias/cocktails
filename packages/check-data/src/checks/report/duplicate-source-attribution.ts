import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { logger } from '../../cli-util.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import { writeJSON } from '../../infra/write-json.ts';

/** One recipe file, as the duplicate-attribution check reads it. */
export interface SourceAttributionEntry {
  /** Path relative to the data package root, for messages. */
  file: string;
  /** The source the recipe lives under, from the file's path. */
  sourceType: 'book' | 'youtube-channel' | 'podcast';
  sourceSlug: string;
  attributions: ReadonlyArray<{ relation: string; source: string }>;
  refs: ReadonlyArray<{ type: string; title?: string }>;
}

/** A source-attribution pair naming the same book, for the warning pass. */
export interface DuplicateBookCredit {
  file: string;
  /** The book's name, as the attribution credits it. */
  name: string;
}

/**
 * Find attributions that credit the recipe's own source — the entity the
 * recipe page's source card already renders, and for authors the very list
 * the source's own page is. A host credited by name (Derek Cole on the Make
 * and Drink channel) is a different entity and stays. Bar attributions stay
 * too: a book about a bar credits the bar itself, and the bar's page is a
 * different entity from the book's.
 */
export function findRedundantSourceAttributions(
  recipes: ReadonlyArray<SourceAttributionEntry>,
  /** `${type}/${slug}` -> the source's display name, from its _source.json. */
  sourceNames: ReadonlyMap<string, string>,
): SourceAttributionEntry[] {
  const redundant: SourceAttributionEntry[] = [];

  for (const recipe of recipes) {
    const sourceName = sourceNames.get(`${recipe.sourceType}/${recipe.sourceSlug}`);
    if (!sourceName) continue;

    const ownSlug = slugify(sourceName);
    for (const attribution of recipe.attributions) {
      if (attribution.relation === 'bar') continue;
      if (slugify(attribution.source) === ownSlug) {
        redundant.push(recipe);
        break;
      }
    }
  }

  return redundant;
}

/**
 * Find recipes that credit the same other book both as a ref and as a book
 * attribution — the same credit carried in two shapes. The book ref to the
 * recipe's own source is the designed pattern (it carries the page number
 * into the source card) and is never reported here; that shape's duplication
 * is the redundant own-source attribution above.
 */
export function findDuplicateBookCredits(
  recipes: ReadonlyArray<SourceAttributionEntry>,
): DuplicateBookCredit[] {
  const duplicates: DuplicateBookCredit[] = [];

  for (const recipe of recipes) {
    const ownSourceRefTitles = new Set(
      recipe.refs
        .map((ref) => ref.title)
        .filter(
          (title): title is string =>
            title != null && slugify(title) === recipe.sourceSlug,
        ),
    );
    const creditedElsewhere = new Set(
      recipe.refs
        .filter((ref) => ref.type === 'book' && ref.title != null)
        .map((ref) => ref.title!)
        .filter((title) => !ownSourceRefTitles.has(title)),
    );

    for (const attribution of recipe.attributions) {
      if (attribution.relation !== 'book') continue;
      if (creditedElsewhere.has(attribution.source)) {
        duplicates.push({ file: recipe.file, name: attribution.source });
      }
    }
  }

  return duplicates;
}

const sourceTypes = ['book', 'youtube-channel', 'podcast'] as const;

async function loadSourceNames(): Promise<Map<string, string>> {
  const sourceNames = new Map<string, string>();
  for (const sourceType of sourceTypes) {
    const typeRoot = path.join(PACKAGE_ROOT, 'data/recipes', sourceType);
    for (const sourceSlug of await fs.readdir(typeRoot)) {
      const sourceFile = path.join(typeRoot, sourceSlug, '_source.json');
      try {
        const source: { name: string } = JSON.parse(
          await fs.readFile(sourceFile, 'utf-8'),
        );
        sourceNames.set(`${sourceType}/${sourceSlug}`, source.name);
      } catch {
        // Unreadable or missing _source.json: the per-file pass reports it.
      }
    }
  }
  return sourceNames;
}

/**
 * Fails on attributions crediting the recipe's own source and rewrites the
 * files without them — the duplication doubles the entity's card on the
 * recipe page (the source card plus the attribution row) and, for authors,
 * mirrors the source's own page. The rewritten run still fails: the diff
 * carries a removed credit, so it lands in a commit by review, like the
 * metadata-stub creation autofixes.
 */
export async function reportDuplicateSourceAttributions(): Promise<void> {
  logger.header('📇 Checking for duplicate source attributions...');

  const sourceNames = await loadSourceNames();
  const recipes: SourceAttributionEntry[] = [];
  for (const sourceType of sourceTypes) {
    const typeRoot = path.join(PACKAGE_ROOT, 'data/recipes', sourceType);
    for await (const recipeFile of fs.glob(path.join(typeRoot, '*', '**/*.json'))) {
      if (path.basename(recipeFile) === '_source.json') continue;
      const recipe = JSON.parse(await fs.readFile(recipeFile, 'utf-8'));
      const sourceSlug = path.relative(typeRoot, recipeFile).split(path.sep)[0]!;
      recipes.push({
        file: path.relative(PACKAGE_ROOT, recipeFile),
        sourceType,
        sourceSlug,
        attributions: recipe.attributions ?? [],
        refs: recipe.refs ?? [],
      });
    }
  }

  for (const recipe of findRedundantSourceAttributions(recipes, sourceNames)) {
    const sourceName = sourceNames.get(`${recipe.sourceType}/${recipe.sourceSlug}`)!;
    const fullFile = path.join(PACKAGE_ROOT, recipe.file);
    const recipeData = JSON.parse(await fs.readFile(fullFile, 'utf-8'));

    recipeData.attributions = recipeData.attributions.filter(
      (attribution: { relation: string; source: string }) =>
        attribution.relation === 'bar' ||
        slugify(attribution.source) !== slugify(sourceName),
    );
    if (recipeData.attributions.length === 0) delete recipeData.attributions;
    await writeJSON(fullFile, recipeData);

    report.fail(
      `Removed the "${sourceName}" attribution from ${recipe.file} ` +
        `— the recipe's source card already credits it. Review the diff.`,
    );
  }

  for (const duplicate of findDuplicateBookCredits(recipes)) {
    logger.warn(
      `Book "${duplicate.name}" is credited both as a ref and as an attribution in ` +
        `${duplicate.file}: keep one representation — ` +
        `the ref carries the page number, the attribution the documented-by card.`,
    );
  }

  logger.footer('Done!');
}
