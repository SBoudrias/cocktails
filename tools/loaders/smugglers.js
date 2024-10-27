import { createReadStream } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import _ from 'lodash';
import slugify from '@sindresorhus/slugify';
import { writeJSON } from './_utils.js';

const __dirname = new URL('.', import.meta.url).pathname;
const root = path.join(__dirname, '../../src/data/recipes/book/smugglers-cove');

const INGREDIENT_MAP = {
  '(1-INCH-SQUARE) PINEAPPLE CHUNKS': {
    name: 'Pineapple chunks',
    type: 'fruit',
  },
  'FRUIT (PINEAPPLE)': {
    name: 'Pineapple chunks',
    type: 'fruit',
  },
  'LEAVES (MINT)': {
    name: 'Mint leaves',
    type: 'other',
  },
  'JUICE (LIME)': {
    name: 'Lime juice',
    type: 'juice',
  },
  'SYRUP (DEMERARA)': {
    name: 'Demerara syrup',
    brix: 66,
    type: 'syrup',
  },
  'RUM (BLENDED LIGHTLY AGED)': {
    name: 'Blended lightly aged rum',
    type: 'category',
  },
  'JUICE (ORANGE)': {
    name: 'Orange juice',
    type: 'juice',
  },
  'SYRUP (CINNAMON)': {
    name: 'Cinnamon syrup',
    brix: 66,
    type: 'syrup',
  },
  'SYRUP (VANILLA)': {
    name: 'Vanilla syrup',
    brix: 66,
    type: 'syrup',
  },
  'ST. ELIZABETH ALLSPICE DRAM': {
    name: 'St-Elizabeth Allspice Dram',
    type: 'liqueur',
  },
  'RUM (COLUMN STILL AGED)': {
    name: 'Column still aged rum',
    type: 'category',
  },
  'ANGOSTURA BITTERS': {
    name: 'Angostura bitters',
    type: 'bitter',
  },
  'SYRUP (GRENADINE)': {
    name: 'Grenadine',
    brix: 50,
    type: 'syrup',
  },
  'LEOPOLD BROTHERS ROCKY MOUNTAIN BLACKBERRY LIQUEUR': {
    name: 'Leopold brothers rocky mountain blackberry liqueur',
    type: 'liqueur',
  },
  'RUM (BLENDED AGED)': {
    name: 'Blended aged rum',
    type: 'category',
  },
  'RUM (BLACK BLENDED)': {
    name: 'Black blended rum',
    type: 'category',
  },
  'JUICE (PINEAPPLE)': {
    name: 'Pineapple juice',
    type: 'juice',
  },
  "JOHN D. TAYLOR'S VELVET FALERNUM": {
    name: "John D. Taylor's Velvet Falernum",
    type: 'liqueur',
  },
  'RUM (CANE COFFEY STILL AGED)': {
    name: 'Cane coffey still aged rum',
    type: 'category',
  },
  'SYRUP (HONEY)': {
    name: 'Honey syrup',
    brix: 50,
    type: 'syrup',
  },
  'RUM (CANE AOC MARTINIQUE RHUM AGRICOLE VIEUX)': {
    name: 'Rhum agricole vieux',
    type: 'category',
  },
  'FRUIT (LIME)': {
    name: 'Lime wedge',
    type: 'fruit',
  },
  'LIQUEUR (CRÈME DE CASSIS)': {
    name: 'Crème de Cassis',
    type: 'liqueur',
  },
  'TEQUILA (BLANCO)': {
    name: 'Blanco tequila',
    type: 'category',
  },
  'GINGER ALE': {
    name: 'Ginger ale',
    type: 'soda',
  },
  'EGG (WHITE)': {
    name: 'Egg white',
    type: 'other',
  },
  'WHISKEY (BOURBON)': {
    name: 'Bourbon whiskey',
    type: 'category',
  },
  'JUICE (LEMON)': {
    name: 'Lemon juice',
    type: 'juice',
  },
  'SYRUP (PASSION FRUIT)': {
    name: 'Passion fruit syrup',
    brix: 66,
    type: 'syrup',
  },
  'RUM (BLACK BLENDED OVERPROOF)': {
    name: 'Black blended overproof rum',
    type: 'category',
  },
  'LUXARDO MARASCHINO LIQUEUR': {
    name: 'Luxardo maraschino liqueur',
    type: 'liqueur',
  },
  'JUICE (GRAPEFRUIT)': {
    name: 'Grapefruit juice',
    type: 'juice',
  },
  'BITTERS (HERBSTURA)': {
    name: 'Herbstura',
    type: 'bitter',
  },
  "GARNISH (SIDEWINDER'S FANG PEEL)": false,
  SELTZER: {
    name: 'Seltzer',
    type: 'soda',
  },
  ORGEAT: {
    name: 'Orgeat',
    brix: 50,
    type: 'syrup',
  },
  VODKA: {
    name: 'Vodka',
    type: 'category',
  },
  'SYRUP (MAPLE)': {
    name: 'Maple syrup',
    type: 'syrup',
  },
  'EXTRACT (VANILLA)': {
    name: 'Vanilla extract',
    type: 'other',
  },
  'EXTRACT (ALMOND)': {
    name: 'Almond extract',
    type: 'other',
  },
  'PIERRE FERRAND DRY CURACAO': {
    name: 'Pierre Ferrand Dry Curaçao',
    type: 'liqueur',
  },
  'BEER (GINGER)': {
    name: 'Ginger beer',
    type: 'soda',
  },
  'GIN (LONDON DRY)': {
    name: 'London dry gin',
    type: 'category',
  },
  'BRANDY (GRAPE)': {
    name: 'Cognac',
    type: 'category',
  },
  'LIQUEUR (CHERRY HEERING)': {
    name: 'Cherry Heering liqueur',
    type: 'category',
  },
  'BRANDY (APPLE)': {
    name: 'Calvados',
    type: 'category',
  },
  'SYRUP (MOLASSES)': {
    name: 'Molasses syrup',
    brix: 66,
    type: 'syrup',
  },
  'AMARO (DI ANGOSTURA)': {
    name: 'Amaro di Angostura',
    type: 'liqueur',
  },
  'POT STILL LIGHTLY AGED RUM (OVERPROOF)': {
    name: 'Pot still lightly aged overproof rum',
    type: 'category',
  },
  'BUNDABERG GUAVA SODA': {
    name: 'Bundaberg guava soda',
    type: 'soda',
  },
  'CREAM (COCONUT)': {
    name: 'Cream of coconut',
    type: 'syrup',
  },
  'LIQUEUR (APRICOT)': {
    name: 'Apricot liqueur',
    type: 'category',
  },
  'FRUIT (PEACH)': {
    name: 'Peach slice',
    type: 'fruit',
  },
  'AMARO (CAMPARI)': {
    name: 'Campari',
    type: 'liqueur',
  },
  'WINE (SPARKLING)': {
    name: 'Sparkling wine',
    type: 'category',
  },
  'FENTIMANS VICTORIAN LEMONADE (OR ANY QUALITY DRY SPARKLING LEMONADE)': {
    name: 'Fentimans victorian lemonade',
    type: 'soda',
  },
  'LICOR 43 SPICED LIQUEUR': {
    name: 'Licor 43',
    type: 'liqueur',
  },
  'SPICE (CINNAMON)': {
    name: 'Cinnamon',
    type: 'spice',
  },
  'SPICE (NUTMEG)': {
    name: 'Nutmeg',
    type: 'spice',
  },
  'LIQUEUR (PEAR)': {
    name: 'Pear liqueur',
    type: 'category',
  },
  'LIQUEUR (DRAMBUIE)': {
    name: 'Drambruie',
    type: 'liqueur',
  },
  'BITTERS (CREOLE)': {
    name: "Peychaud's bitters",
    type: 'bitter',
  },
  'VERMOUTH (SWEET)': {
    name: 'Sweet vermouth',
    type: 'category',
  },
  'PORT (TAWNY)': {
    name: 'Tawny Port',
    type: 'category',
  },
  'BITTERS (TIKI)': {
    name: 'Bittermens Elemakule Tiki bitters',
    type: 'bitter',
  },
  AQUAVIT: {
    name: 'Aquavit',
    type: 'category',
  },
  'LIQUEUR (ORANGE BLUE)': {
    name: 'Blue curaçao',
    type: 'category',
  },
  'LIQUEUR (CHARTREUSE GREEN)': {
    name: 'Green Chartreuse',
    type: 'liqueur',
  },
  'LIQUEUR (HIBISCUS)': {
    name: 'SC Hibiscus liqueur',
    type: 'liqueur',
  },
  'ST. GEORGE RASPBERRY LIQUEUR': {
    name: 'St. George Raspberry liqueur',
    type: 'liqueur',
  },
  'LIQUEUR (RASPBERRY)': {
    name: 'ST. GEORGE RASPBERRY LIQUEUR',
    type: 'liqueur',
  },
  'PEACH LIQUEUR (SUCH AS MATHILDE, COMBIER, OR GIFFARD)': {
    name: 'Mathilde pêche',
    type: 'liqueur',
  },
  'LIME WEDGE': {
    name: 'Lime wedge',
    type: 'fruit',
  },
  'APRICOT LIQUEUR (SUCH AS ROTHMAN & WINTER APRICOT LIQUEUR OR GIFFARD ABRICOT DU ROUSSILLON)':
    {
      name: 'Giffard abricot du Roussillon',
      type: 'liqueur',
    },
  'YELLOW OR WHITE PEACH, PITTED, AND COARSELY CHOPPED INTO CHUNKS (WITH SKIN)': {
    name: 'Peach',
    type: 'fruit',
  },
  'PEACH LIQUEUR (SUCH AS MATHILDE PEACH OR COMBIER CRÈME DE PÊCHE DE VIGNE)': {
    name: 'Mathilde pêche',
    type: 'liqueur',
  },
  'LIQUEUR (LICOR 43)': {
    name: 'Licor 43',
    type: 'liqueur',
  },
  'GRATED CINNAMON': {
    name: 'Cinnamon',
    type: 'spice',
  },
  'GRATED NUTMEG': {
    name: 'Nutmeg',
    type: 'spice',
  },
  'PEAR LIQUEUR (SUCH AS MATHILDE POIRE)': {
    name: 'Mathilde poire',
    type: 'liqueur',
  },
  "PEYCHAUD'S BITTERS": {
    name: "Peychaud's bitters",
    type: 'bitter',
  },
  'PUNT E MES': {
    name: 'Punt e Mes',
    type: 'liqueur',
  },
  "BITTERMENS 'ELEMAKULE TIKI BITTERS": {
    name: "Bittermens' elemakule tiki bitters",
    type: 'bitter',
  },
  'CHAMPAGNE OR SPARKLING WINE': {
    name: 'Sparkling wine',
    type: 'category',
  },
  'BLUE CURACAO': {
    name: 'Blue Curaçao',
    type: 'category',
  },
  'GROUND CINNAMON': {
    name: 'Cinnamon',
    type: 'spice',
  },
  'PUREE (PASSION FRUIT)': {
    name: 'Passion fruit purée',
    type: 'puree',
  },
  'GIFFARD BANANE DU BRÉSIL BANANA LIQUEUR': {
    name: 'Giffard banane du Brésil',
    type: 'liqueur',
  },
  'SYRUP (MARTINIQUE SUGARCANE)': {
    name: 'Cane syrup',
    brix: 66,
    type: 'syrup',
  },
  'TING GRAPEFRUIT SODA': {
    name: 'Ting grapefruit soda',
    type: 'soda',
  },
  'PERUVIAN PISCO': {
    name: 'Peruvian pisco',
    type: 'category',
  },
  GIN: {
    name: 'Gin',
    type: 'category',
  },
  'BITTERS (BITTERMENS BURLESQUE)': {
    name: "Bittermens' Burlesque Bitters",
    type: 'bitter',
  },
  SECRET: false,
  'LI HING MUI POWDER': {
    name: 'Li Hing Mui powder',
    type: 'spice',
  },
  'LIQUEUR (MARASCHINO)': {
    name: 'Luxardo maraschino liqueur',
    type: 'liqueur',
  },
  'RUM (POT STILL UNAGED)': {
    name: 'Pot still unaged rum',
    type: 'category',
  },
  'BLENDED AGED RUM (GUYANA)': {
    name: 'Demerara blended aged rum',
    type: 'category',
  },
  'VANILLLA SYRUP': {
    name: 'Vanilla syrup',
    brix: 66,
    type: 'syrup',
  },
  'BITTERMENS NEW ORLEANS COFFEE LIQUEUR': {
    name: "Bittermens' New Orleans coffee liqueur",
    type: 'liqueur',
  },
  'ABSINTHE (BLANC)': {
    name: 'Absinthe blanche',
    type: 'category',
  },
  'JUICE (GRAPEFRUIT) (WHITE OR PINK)': {
    name: 'Grapefuit juice',
    type: 'juice',
  },
  'BRANDY (VANILLA)': {
    name: 'Vanilla brandy',
    type: 'category',
  },
  'BITTERS (ORANGE)': {
    name: 'Orange bitters',
    type: 'bitter',
  },
  'SYRUP (NAPA WINE)': {
    name: 'SC Napa wine syrup',
    type: 'syrup',
  },
  'BATAVIA ARRACK': {
    name: 'Batavia Arrack van Oosten',
    type: 'spirit',
  },
  'CABONATED CHAI TEA': {
    name: 'Carbonated chai tea',
    type: 'soda',
  },
  'POT STILL AGED CACHAÇA': {
    name: 'Aged Cachaça',
    type: 'category',
  },
  RUM: {
    name: 'Rum',
    type: 'category',
  },
  'EGG MEDIUM': {
    name: 'Egg',
    type: 'other',
  },
  'EXTRACT (SPRUCE BEER SODA)': {
    name: 'Spruce beer soda extract',
    type: 'other',
  },
  'ZIRBENZ STONE PINE LIQUEUR': {
    name: 'Zirbenz Stone Pine Liqueur of the Alps',
    type: 'liqueur',
  },
  'LIQUEUR (YELLOW CHARTREUSE)': {
    name: 'Yellow Chartreuse',
    type: 'liqueur',
  },
  'VERMOUTH (DRY)': {
    name: 'Dry vermouth',
    type: 'liqueur',
  },
  'WHISKEY (RYE)': {
    name: 'Rye whiskey',
    type: 'category',
  },
  'CREAM (SWEET)': {
    name: 'Sweet cream',
    type: 'other',
  },
  'SMALL HAND FOODS RASPBERRY GUM SYRUP': {
    name: 'Small hand foods raspberry gum syrup',
    type: 'syrup',
  },
  'BLACK POT STILL RUM': {
    name: 'Black pot still rum',
    type: 'category',
  },
  'GIN (SLOE)': {
    name: 'Sloe gin',
    type: 'category',
  },
  'COCONUT MILK': {
    name: 'Coconut milk',
    type: 'other',
  },
  'SWEETENED CONDENSED MILK': {
    name: 'Sweetened condensed milk',
    type: 'other',
  },
  'RUM (WRAY & NEPHEW WHITE OVERPROOF)': {
    name: 'Wray & Nephew white overproof',
    type: 'spirit',
  },
  'SODA (GRAPEFRUIT (TING))': {
    name: 'Ting grapefruit soda',
    type: 'soda',
  },
  'BLENDED AGED RUM (JAMAICA)': {
    name: 'Blended aged jamaican rum',
    type: 'category',
  },
  'CANE AOC MARTINIQUE RHUM AGRICOLE BLANC': {
    name: 'Rhum agricole blanc',
    type: 'category',
  },
  'LIME SMALL ROUNDED CHUNK': {
    name: 'Lime chunk',
    type: 'fruit',
  },
  'BLENDED AGED RUM (BARBADOS)': {
    name: 'Blended aged barbados rum',
    type: 'category',
  },
  'MILK (WHOLE)': {
    name: 'Whole milk',
    type: 'other',
  },
  'CREAM (HEAVY WHIPPING)': {
    name: 'Heavy whipping cream',
    type: 'other',
  },
  'BLACK BLENDED RUM (JAMAICA)': {
    name: 'Black blended jamaican rum',
    type: 'category',
  },
  'BITTERMENS XOCOLATL (CHOCOLATE) MOLE BITTERS': {
    name: 'Bittermens Xocolatl Mole Bitters',
    type: 'bitter',
  },
  '2:1 SIMPLE SYRUP': {
    name: 'Simple syrup',
    brix: 66,
    type: 'syrup',
  },
  'POT STILL LIGHTLY AGED RUM (NEW ENGLAND)': {
    name: 'Pot still lightly aged new england rum',
    type: 'category',
  },
  "BLANDY'S 5 YEAR VERDELHO MADEIRA": {
    name: "Blandy's 5 year verdelho madeira",
    type: 'spirit',
  },
  'HOT BUTTERED RUM BATTER': {
    name: 'Hot buttered rum batter',
    type: 'other',
  },
  'WATER HOT': {
    name: 'Hot water',
    type: 'other',
  },
  'SYRUP (LI HING MUI)': {
    name: 'Li Hing Mui syrup',
    brix: 66,
    type: 'syrup',
  },
  'SYRUP (JERK)': {
    name: 'Jerk syrup',
    brix: 66,
    type: 'syrup',
  },
  'HELLFIRE TINCTURE': {
    name: 'Hellfire tincture',
    type: 'tincture',
  },
  'STIEGL-RADLER GRAPEFRUIT BEER': {
    name: 'Stiegl-Radler grapefruit beer',
    type: 'soda',
  },
  'RUM (R.L. SEALE 10 YEAR)': {
    name: 'R.L. Seale 10 year',
    type: 'spirit',
  },
  'WINE (SPARKLING) (CHAMPAGNE)': {
    name: 'Champagne',
    type: 'wine',
  },
  'AMARO (AVERNA)': {
    name: 'Amaro Averna',
    type: 'liqueur',
  },
  'WATER BOILING': {
    name: 'Boiling water',
    type: 'other',
  },
  '(1-INCH-SQUARE) CHUNKS PINEAPPLE': {
    name: 'Pineapple chunks',
    type: 'fruit',
  },
  'COCONUT WATER': {
    name: 'Coconut water',
    type: 'other',
  },
  'RUM (COLUMN STILL LIGHTLY AGED)': {
    name: 'Column still lightly aged',
    type: 'category',
  },
  "GIN (BROKER'S)": {
    name: "Broker's London dry gin",
    type: 'spirit',
  },
  'LIQUEUR (GINGER)': {
    name: 'Ginger liqueur',
    type: 'category',
  },
  'SYRUP (MAI TAI RICH SIMPLE)': {
    name: 'SC Mai Tai rich simple syrup',
    brix: 66,
    type: 'syrup',
  },
  'DEMERARA SIMPLE SYRUP': {
    name: 'Demerara syrup',
    type: 'syrup',
  },
  'ABSINTHE (HERBSAINT)': {
    name: 'Herbsaint',
    type: 'category',
  },
  'RUM (BLACK POT STILL UNAGED)': {
    name: 'Black pot still unaged rum',
    type: 'category',
  },
  'BRANDY (PISCO)': {
    name: 'Pisco',
    type: 'category',
  },
  'SHERRY (OLOROSO)': {
    name: 'Oloroso sherry',
    type: 'category',
  },
  'LIQUEUR (BENEDICTINE)': {
    name: 'Benedictine',
    type: 'liqueur',
  },
  'SYRUP (PASSION FRUIT HONEY)': {
    name: 'Passion fruit honey syrup',
    type: 'syrup',
  },
};

const processFile = async () => {
  const records = [];
  const ingredients = new Set();
  const parser = createReadStream(path.join(__dirname, '../../raw/sc.csv')).pipe(
    parse({
      // CSV options if any
      delimiter: '	',
    }),
  );
  for await (const record of parser) {
    // Work with each record
    records.push(record);
    const key = record[1] || record[3];
    if (key !== 'notes' && !(key in INGREDIENT_MAP)) ingredients.add(key);
  }

  if (ingredients.size > 0) {
    console.log('Missing ingredients:');
    console.log(ingredients);
  }

  const groupedIngredients = Object.groupBy(
    // Skip the first record
    records.slice(1),
    (record) => record[0],
  );
  for await (const [name, ingredients] of Object.entries(groupedIngredients)) {
    const recipe = {
      $schema: '../../../../schemas/recipe.schema.json',
      name: _.capitalize(name),
      preparation: 'TODO',
      served_on: 'TODO',
      glassware: 'TODO',
      ingredients: ingredients
        .map((record) => {
          const key = record[1] || record[3];
          const data = INGREDIENT_MAP[key];
          if (data === false) return false;

          return {
            ...data,
            quantity: {
              amount: 'TODO',
              unit: 'oz',
            },
          };
        })
        .filter(Boolean),
      refs: [
        {
          type: 'book',
          page: parseInt(ingredients[0][4]),
          title: 'smugglers-cove',
        },
      ],
    };

    await writeJSON(path.join(root, `${slugify(name)}.json`), recipe);
  }
};

await processFile();
