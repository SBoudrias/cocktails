import { describe, expect, it } from 'vitest';
import { findCategorizationSystemProblems } from './categorization-systems.ts';

// A tiny catalog: a Smuggler's Cove-like tree under Rum with a flavored
// island and a charanda house category, a Minimalist Tiki-like style system
// covering Rum, and a gin outside both.
const parentsOf = new Map<string, string[]>([
  ['Rum', []],
  ['Jamaican rum', ['Rum']],
  ['Blended aged rum (Jamaica)', ['Jamaican rum']],
  ['Black blended rum', ['Rum']],
  ['Flavored rum', ['Rum']],
  ['Coconut rum', ['Flavored rum']],
  ['Charanda', ['Rum']],
  ['Gin', []],
]);

// The outsideOf marks as data-context collects them: from system nodes
// (Flavored rum) and loose category files (Charanda) alike.
const outsideOf = new Map<string, string[]>([
  ['Flavored rum', ['Minimalist Tiki']],
  ['Charanda', ['Minimalist Tiki', "Smuggler's Cove"]],
]);

const sc = {
  slug: 'smugglers-cove',
  name: "Smuggler's Cove",
  covers: ['Rum'],
  nodes: [
    { name: 'Rum' },
    { name: 'Jamaican rum', parents: ['Rum'] },
    { name: 'Black blended rum', parents: ['Rum'] },
    { name: 'Flavored rum', parents: ['Rum'], outsideOf: ['Minimalist Tiki'] },
    { name: 'Coconut rum', parents: ['Flavored rum'] },
    { name: 'Blended aged rum (Jamaica)', parents: ['Jamaican rum'] },
  ],
};

const mt = {
  slug: 'minimalist-tiki',
  name: 'Minimalist Tiki',
  covers: ['Rum'],
  nodes: [{ name: 'Aged Jamaican rum' }],
};

const noExemptions = new Map<string, Map<string, string>>([]);

describe('findCategorizationSystemProblems', () => {
  it('accepts members, bottle-level exemptions and outsideOf subtrees', () => {
    const ingredients = new Map([
      ['Appleton 12', ['Blended aged rum (Jamaica)', 'Aged Jamaican rum']],
      ['Malibu', ['Coconut rum']],
      ['Goslings Black Seal Rum', ['Black blended rum']],
      ['Uruapan Charanda Blanco Rum', ['Charanda']],
      ['Tanqueray', ['Gin']],
    ]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt],
        parentsOf,
        outsideOf,
        ingredients,
        new Map([
          [
            'Goslings Black Seal Rum',
            new Map([['Minimalist Tiki', 'Bermuda black rum; no MT style']]),
          ],
        ]),
      ),
    ).toEqual([]);
  });

  it('reaches the cover through parents, not only a literal category', () => {
    // The bottle never names Rum: it is a rum through Jamaican rum.
    const ingredients = new Map([['Appleton 12', ['Blended aged rum (Jamaica)']]]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt],
        parentsOf,
        outsideOf,
        ingredients,
        noExemptions,
      ),
    ).toMatchInlineSnapshot(`
      [
        ""Appleton 12" is in "Rum" but has no Minimalist Tiki category, no exemption in its own file, and none of its categories is outside Minimalist Tiki: add the matching category, an exemptFrom on the bottle, or an outsideOf mark on the category",
      ]
    `);
  });

  it('flags a bottle both member and exempted', () => {
    const ingredients = new Map([
      ['Appleton 12', ['Blended aged rum (Jamaica)', 'Aged Jamaican rum']],
    ]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt],
        parentsOf,
        outsideOf,
        ingredients,
        new Map([['Appleton 12', new Map([['Minimalist Tiki', 'Too old']])]]),
      ),
    ).toMatchInlineSnapshot(`
      [
        ""Appleton 12" has a Minimalist Tiki category and is exempted from it in its own file: drop one",
      ]
    `);
  });

  it('flags a stale exemption on a bottle outside the covered family', () => {
    const ingredients = new Map([['Tanqueray', ['Gin']]]);

    expect(
      findCategorizationSystemProblems(
        [sc, mt],
        parentsOf,
        outsideOf,
        ingredients,
        new Map([['Tanqueray', new Map([['Minimalist Tiki', 'Not a rum']])]]),
      ),
    ).toMatchInlineSnapshot(`
      [
        ""Tanqueray" is exempted from Minimalist Tiki in its own file but is not in Rum: remove the exemption",
      ]
    `);
  });
});
