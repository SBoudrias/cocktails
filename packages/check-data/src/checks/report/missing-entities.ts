import path from 'node:path';
import slugify from '@sindresorhus/slugify';

export interface RecipeAttributions {
  /** The recipe file's path, for the report messages. */
  filepath: string;
  attributions: Array<{ relation: string; source: string; location?: string }>;
}

export interface MissingEntity {
  kind: 'author' | 'bar';
  /** The entity file's slug: the name for authors, name and location for bars. */
  slug: string;
  /** The recipe files crediting the entity, for the report messages. */
  recipeFiles: string[];
}

/**
 * Find attributions that credit an author or bar with no entity file. The
 * entity system requires one file per credited name (bars keyed by name and
 * location). check-data used to create name-only stubs here silently, which
 * left generated files lying around on every run and got them swept into
 * unrelated commits — missing entities now fail the run instead, and this
 * pure pass finds them so the caller can report the exact file to add.
 */
export function findMissingEntities(
  recipes: readonly RecipeAttributions[],
  entitySlugs: { authors: ReadonlySet<string>; bars: ReadonlySet<string> },
): Map<string, MissingEntity> {
  const missing = new Map<string, MissingEntity>();

  for (const recipe of recipes) {
    for (const attribution of recipe.attributions) {
      const isAuthor =
        attribution.relation === 'recipe author' || attribution.relation === 'adapted by';
      if (!isAuthor && attribution.relation !== 'bar') continue;

      const kind: MissingEntity['kind'] = isAuthor ? 'author' : 'bar';
      const slug = isAuthor
        ? slugify(attribution.source)
        : slugify(`${attribution.source} ${attribution.location ?? ''}`);

      const existing = isAuthor ? entitySlugs.authors : entitySlugs.bars;
      if (existing.has(slug)) continue;

      const key = `${kind}s/${slug}`;
      const entity = missing.get(key) ?? { kind, slug, recipeFiles: [] };
      entity.recipeFiles.push(path.basename(recipe.filepath));
      missing.set(key, entity);
    }
  }

  return missing;
}
