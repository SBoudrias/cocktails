import { describe, expect, it } from 'vitest';
import type { RecipeAttributions } from './missing-entities.ts';
import { findMissingEntities } from './missing-entities.ts';

const entitySlugs = {
  authors: new Set(['anders-erickson']),
  bars: new Set(['zasu-new-orleans-la', 'trader-sams-enchanted-tiki-bar-anaheim-ca']),
};

const recipe = (
  name: string,
  attributions: RecipeAttributions['attributions'][number][],
) => ({
  filepath: `/data/recipes/youtube-channel/make-and-drink/${name}.json`,
  attributions,
});

describe('findMissingEntities', () => {
  it('reports a credited author with no entity file', () => {
    const missing = findMissingEntities(
      [
        recipe('the-autumn-wind', [
          { relation: 'recipe author', source: 'Martin Delgado' },
        ]),
      ],
      entitySlugs,
    );

    expect([...missing.values()]).toMatchInlineSnapshot(`
      [
        {
          "kind": "author",
          "recipeFiles": [
            "the-autumn-wind.json",
          ],
          "slug": "martin-delgado",
        },
      ]
    `);
  });

  it('keys bars by name and location, including bars credited without one', () => {
    const missing = findMissingEntities(
      [
        recipe('the-autumn-wind', [
          { relation: 'bar', source: 'Prizefighter', location: 'Emeryville, CA' },
        ]),
        recipe('chilling-challenge', [{ relation: 'bar', source: "Trader Sam's" }]),
      ],
      entitySlugs,
    );

    expect([...missing.values()]).toMatchInlineSnapshot(`
      [
        {
          "kind": "bar",
          "recipeFiles": [
            "the-autumn-wind.json",
          ],
          "slug": "prizefighter-emeryville-ca",
        },
        {
          "kind": "bar",
          "recipeFiles": [
            "chilling-challenge.json",
          ],
          "slug": "trader-sams",
        },
      ]
    `);
  });

  it('merges the recipe files crediting the same missing entity', () => {
    const missing = findMissingEntities(
      [
        recipe('caribbean-ember', [
          { relation: 'recipe author', source: 'Tyler Malone' },
        ]),
        recipe('other-drink', [{ relation: 'adapted by', source: 'Tyler Malone' }]),
      ],
      entitySlugs,
    );

    expect(missing.get('authors/tyler-malone')?.recipeFiles).toMatchInlineSnapshot(`
      [
        "caribbean-ember.json",
        "other-drink.json",
      ]
    `);
  });

  it('reports nothing for existing entities and unrelated attribution relations', () => {
    const missing = findMissingEntities(
      [
        recipe('caribbean-ember', [
          { relation: 'recipe author', source: 'Anders Erickson' },
          { relation: 'bar', source: 'Zasu', location: 'New Orleans, LA' },
        ]),
        recipe('safari-swizzle', [
          {
            relation: 'bar',
            source: 'Trader Sam\u0027s Enchanted Tiki Bar',
            location: 'Anaheim, CA',
          },
        ]),
      ],
      entitySlugs,
    );

    expect(missing.size).toBe(0);
  });
});
