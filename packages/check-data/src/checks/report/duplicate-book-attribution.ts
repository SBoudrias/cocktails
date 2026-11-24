import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { logger } from '../../cli-util.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import { writeJSON } from '../../infra/write-json.ts';

/** One recipe file, as the duplicate book-credit check reads it. */
export interface BookCreditEntry {
  /** Path relative to the data package root, for messages. */
  file: string;
  /** The source the recipe lives under, from the file's path. */
  sourceType: 'book' | 'youtube-channel' | 'podcast';
  sourceSlug: string;
  attributions: ReadonlyArray<{ relation: string; source: string }>;
  refs: ReadonlyArray<{ type: string; title?: string }>;
}

/** A redundant book attribution: one naming the recipe's own book. */
export interface RedundantBookAttribution {
  file: string;
  /** The book's name, as the source's own file declares it. */
  name: string;
}

/**
 * Find book attributions that credit the recipe's own source: the recipe
 * already lives under that book, whose card the recipe page renders. A book
 * attribution to another book stays — that credits where the recipe was
 * documented before this source carried it. Author and bar attributions stay
 * untouched: a channel host credited by name (Derek Cole, Anders Erickson)
 * is a person, not the channel, and their author page is distinct from the
 * source's; a bar sharing the book source's name is likewise another entity.
 */
export function findRedundantBookAttributions(
  recipes: ReadonlyArray<BookCreditEntry>,
  /** `${type}/${slug}` -> the source's display name, from its _source.json. */
  sourceNames: ReadonlyMap<string, string>,
): RedundantBookAttribution[] {
  const redundant: RedundantBookAttribution[] = [];

  for (const recipe of recipes) {
    const sourceName = sourceNames.get(`${recipe.sourceType}/${recipe.sourceSlug}`);
    if (!sourceName) continue;

    for (const attribution of recipe.attributions) {
      if (attribution.relation !== 'book') continue;
      if (slugify(attribution.source) === slugify(sourceName)) {
        redundant.push({ file: recipe.file, name: sourceName });
      }
    }
  }

  return redundant;
}

/** A book credited in two shapes on the same recipe, for the warning pass. */
export interface DuplicateBookCredit {
  file: string;
  /** The book's name, as the attribution credits it. */
  name: string;
}

/**
 * Find recipes crediting the same other book both as a ref and as a book
 * attribution — the same credit carried in two shapes. The book ref to the
 * recipe's own source is the designed pattern (it carries the page number
 * into the source card) and never counts; that shape's duplication is the
 * redundant own-source attribution above.
 */
export function findDuplicateBookCredits(
  recipes: ReadonlyArray<BookCreditEntry>,
): DuplicateBookCredit[] {
  const duplicates: DuplicateBookCredit[] = [];

  for (const recipe of recipes) {
    const creditedAsRefs = new Set(
      recipe.refs
        .filter((ref) => ref.type === 'book' && ref.title != null)
        .map((ref) => ref.title!),
    );

    for (const attribution of recipe.attributions) {
      if (attribution.relation !== 'book') continue;
      if (slugify(attribution.source) === recipe.sourceSlug) continue;
      if (creditedAsRefs.has(attribution.source)) {
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
 * Fails on book attributions crediting the recipe's own book and rewrites
 * the files without them — the recipe page's source card already credits
 * it. The rewritten run still fails: the diff carries a removed credit, so
 * it lands in a commit by review, like the metadata-stub creation autofixes.
 * Also warns when another book is credited both as a ref and as an
 * attribution: the ref carries the page number, the attribution the
 * documented-by card — one representation should stay.
 */
export async function reportDuplicateBookAttributions(): Promise<void> {
  logger.header('📇 Checking for duplicate book attributions...');

  const sourceNames = await loadSourceNames();
  const recipes: BookCreditEntry[] = [];
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

  for (const redundant of findRedundantBookAttributions(recipes, sourceNames)) {
    const fullFile = path.join(PACKAGE_ROOT, redundant.file);
    const recipeData = JSON.parse(await fs.readFile(fullFile, 'utf-8'));

    recipeData.attributions = recipeData.attributions.filter(
      (attribution: { relation: string; source: string }) =>
        attribution.relation !== 'book' ||
        slugify(attribution.source) !== slugify(redundant.name),
    );
    if (recipeData.attributions.length === 0) delete recipeData.attributions;
    await writeJSON(fullFile, recipeData);

    report.fail(
      `Removed the "${redundant.name}" book attribution from ${redundant.file} ` +
        `— the recipe already lives under that book's source. Review the diff.`,
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
