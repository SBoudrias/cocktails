import { describe, expect, it } from 'vitest';
import { findCategorizationSystemProblems } from './categorization-systems.ts';

// A tiny catalog: a Smuggler's Cove-like tree under Rum, a Minimalist
// Tiki-like style system covering Rum, and a gin outside both.
const parentsOf = new Map<string, string[]>([
  ['Rum', []],
  ['Jamaican rum', ['Rum']],
  ['Blended aged rum (Jamaica)', ['Jamaican rum']],
  ['Aged Jamaican rum', []],
  ['Gin', []],
]);

const sc = {
  slug: 'smugglers-cove',
  name: "Smuggler's Cove",
  covers: ['Rum'],
  nodes: [
    { name: 'Rum' },
    { name: 'Jamaican rum', parents: ['Rum'] },
    { name: 'Blended aged rum (Jamaica)', parents: ['Jamaican rum'] },
  ],
};

const mt = (exemptions: Array<{ ingredient: string; reason: string }> = []) => ({
  slug: 'minimalist-tiki',
  name: 'Minimalist Tiki',
  covers: ['Rum'],
  nodes: [{ name: 'Aged Jamaican rum' }],
  exemptions,
});

describe('findCategorizationSystemProblems', () => {
  it('accepts members and exempted bottles', () => {
    const ingredients = new Map([
      ['Appleton 12', ['Blended aged rum (Jamaica)', 'Aged Jamaican rum']],
      ['Malibu', ['Rum']],
      ['Tanqueray', ['Gin']],
    ]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt([{ ingredient: 'Malibu', reason: 'Flavored, outside the styles' }])],
        parentsOf,
        ingredients,
      ),
    ).toEqual([]);
  });

  it('reaches the cover through parents, not only a literal category', () => {
    // The bottle never names Rum: it is a rum through Jamaican rum.
    const ingredients = new Map([['Appleton 12', ['Blended aged rum (Jamaica)']]]);

    expect(findCategorizationSystemProblems([sc, mt()], parentsOf, ingredients))
      .toMatchInlineSnapshot(`
      [
        ""Appleton 12" is in "Rum" but has no Minimalist Tiki category and no exemption in minimalist-tiki.json: add the matching category or an exemption with a reason",
      ]
    `);
  });

  it('flags a bottle both member and exempted', () => {
    const ingredients = new Map([
      ['Appleton 12', ['Blended aged rum (Jamaica)', 'Aged Jamaican rum']],
    ]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt([{ ingredient: 'Appleton 12', reason: 'Too old' }])],
        parentsOf,
        ingredients,
      ),
    ).toMatchInlineSnapshot(`
      [
        ""Appleton 12" has a Minimalist Tiki category and an exemption in minimalist-tiki.json: drop one",
      ]
    `);
  });

  it('flags stale, duplicate, unknown and reasonless exemptions', () => {
    const ingredients = new Map([
      ['Malibu', ['Rum']],
      ['Tanqueray', ['Gin']],
    ]);

    expect(
      findCategorizationSystemProblems(
        [
          sc,
          mt([
            { ingredient: 'Malibu', reason: 'Flavored' },
            { ingredient: 'Malibu', reason: ' ' },
            { ingredient: 'Tanqueray', reason: 'Not a rum' },
            { ingredient: 'Ghost rum', reason: 'Gone' },
          ]),
        ],
        parentsOf,
        ingredients,
      ),
    ).toMatchInlineSnapshot(`
      [
        ""Malibu" is exempted twice in minimalist-tiki.json: keep one exemption",
        "Exemption for "Malibu" in minimalist-tiki.json has no reason",
        "Exemption for "Tanqueray" in minimalist-tiki.json is stale: the bottle is outside Rum, so remove the exemption",
        "Exemption in minimalist-tiki.json names unknown ingredient "Ghost rum": fix the name or remove the exemption",
      ]
    `);
  });

  it('flags duplicate names, foreign parents and non-root covers whatever the file order', () => {
    const broken = {
      slug: 'broken',
      name: 'Broken',
      covers: ['Jamaican rum'],
      nodes: [
        { name: 'Aged Jamaican rum' },
        { name: 'Funky rum', parents: ['Rum'] },
        { name: 'Funky rum' },
      ],
    };
    const problems = (systems: Parameters<typeof findCategorizationSystemProblems>[0]) =>
      findCategorizationSystemProblems(systems, parentsOf, new Map()).toSorted();

    // The root-cover rule reads the category tree, not which system file
    // happened to load first.
    expect(problems([broken, mt()])).toContain(
      'Cover category "Jamaican rum" of broken has parents (Rum): covers must be root categories',
    );
    expect(problems([mt(), broken])).toMatchInlineSnapshot(`
      [
        "Category name "Aged Jamaican rum" is declared in both minimalist-tiki.json and broken.json: names must be unique across systems",
        "Category name "Funky rum" is declared twice in broken.json: remove the duplicate node",
        "Cover category "Jamaican rum" of broken has parents (Rum): covers must be root categories",
        "Node "Funky rum" in broken.json has parent "Rum" outside its system: parents must stay within the system",
      ]
    `);
  });

  it('accepts a system that covers its own root node', () => {
    expect(findCategorizationSystemProblems([sc], parentsOf, new Map())).toEqual([]);
  });
});
