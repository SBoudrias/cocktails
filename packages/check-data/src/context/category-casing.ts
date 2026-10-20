/**
 * Category names follow sentence case: only the first word and proper nouns
 * (brands, places, appellations) are capitalized. Generic class words
 * (liqueur, rum, vermouth…), common descriptors (aged, blended, black…),
 * and fruit/plant names are lowercase — e.g. "Peach liqueur",
 * "Blended aged rum (Jamaica)", "Brandy (apple)", "Crème de Mûre".
 *
 * The normalizer is deliberately conservative: it only lowercases words in
 * the curated lists below and capitalizes the first character. Anything else
 * (proper nouns like Heering, Coffey, Barbados, Amontillado) is left as
 * written, so it can never mangle a name it doesn't understand.
 */

// Words that are always lowercase unless they start the name. Generic class
// words for each categoryType plus common descriptors and fruit/plant names.
const LOWERCASE_WORDS = new Set([
  // generic class words
  'liqueur',
  'syrup',
  'wine',
  'bitters',
  'vermouth',
  'cider',
  'dram',
  'shrubb',
  'port',
  'rum',
  'gin',
  'pisco',
  'tequila',
  'sake',
  'juice',
  'beer',
  'cream',
  'curaçao',
  'curacao',
  'cachaça',
  'cachaca',
  'vodka',
  'shochu',
  'ale',
  'amaro',
  'aperitif',
  'apéritif',
  'vieux',
  'blanc',
  'agricole',
  // common descriptors
  'fruit',
  'nut',
  'root',
  'still',
  'aged',
  'unaged',
  'overproof',
  'blended',
  'black',
  'white',
  'red',
  'dry',
  'sweet',
  'sparkling',
  'lightly',
  'strength',
  'navy',
  'barrel',
  'peated',
  'straight',
  'neutral',
  'grain',
  'drinking',
  'vinegar',
  'mix',
  'oil',
  'pepper',
  'flavored',
  'proof',
  // fruit and plant names
  'walnut',
  'apple',
  'pear',
  'apricot',
  'basil',
  'birch',
  'carrot',
  'cherry',
  'grapes',
  'green',
  'chile',
  'hazelnut',
  'mango',
  'peach',
  'plum',
  'raspberry',
  'tomato',
  'shiso',
  'vanilla',
  'corn',
  'rye',
  // spanish age terms
  'blanco',
  'reposado',
  'añejo',
  'anejo',
  'cristalino',
  // french particles
  'de',
  'des',
  'du',
  'la',
]);

function normalizeWord(word: string, isFirstWord: boolean): string {
  const bare = word.replace(/[()]/g, '');
  const parts = bare.split('-').map((part, partIndex) => {
    if (isFirstWord && partIndex === 0) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return LOWERCASE_WORDS.has(part.toLowerCase()) ? part.toLowerCase() : part;
  });
  return word.replace(bare, parts.join('-'));
}

/**
 * Normalize a category name to the sentence-case convention. Idempotent:
 * a name that already follows the convention is returned unchanged.
 */
export function normalizeCategoryCasing(name: string): string {
  return name
    .split(' ')
    .map((word, index) => normalizeWord(word, index === 0))
    .join(' ');
}
