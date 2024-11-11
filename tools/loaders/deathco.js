import { createReadStream } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import _ from 'lodash';
import slugify from '@sindresorhus/slugify';
import { writeJSON } from './_utils.js';

const __dirname = new URL('.', import.meta.url).pathname;
const root = path.join(__dirname, '../../src/data/recipes/book/death-co');

const INGREDIENT_MAP = {};

const CATEGORY_NAME_MAP = {
  Absinthe: { categories: ['Absinthe'], type: 'spirit' },
  'Allspice/Pimento Dram': { categories: ['Allspice/Pimento Dram'], type: 'liqueur' },
  Amaretto: { categories: ['Amaretto'], type: 'liqueur' },
  'Amaro (Abano)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Aperol)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Averna)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Campari)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Cardamaro)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Ciociaro)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Cynar)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Fernet-Branca)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Lucano)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Meletti)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Nardini)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Nonino)': { categories: ['Amaro'], type: 'liqueur' },
  'Amaro (Ramazzotti)': { categories: ['Amaro'], type: 'liqueur' },
  'Apéritif (???)': { categories: ['Apéritif (???)'], type: 'liqueur' },
  'Aperitif (Cocchi Americano)': {
    categories: ['Aperitif (Cocchi Americano)'],
    type: 'liqueur',
  },
  'Aperitif (Gentiane-Quina)': {
    categories: ['Aperitif (Gentiane-Quina)'],
    type: 'liqueur',
  },
  'Aperitif (Raspberry)': { categories: ['Aperitif (Raspberry)'], type: 'liqueur' },
  'Aperitif (Salers Gentian)': {
    categories: ['Aperitif (Salers Gentian)'],
    type: 'liqueur',
  },
  'Apperitif (Lillet Blanc)': {
    categories: ['Apperitif (Lillet Blanc)'],
    type: 'liqueur',
  },
  'Apperitif (Lillet Rosé)': { categories: ['Apperitif (Lillet Rosé)'], type: 'liqueur' },
  'Apperitif (Lillet Rouge)': {
    categories: ['Apperitif (Lillet Rouge)'],
    type: 'liqueur',
  },
  'Apricot Liqueur': { categories: ['Apricot Liqueur'], type: 'liqueur' },
  Aquavit: { categories: ['Aquavit'], type: 'spirit' },
  'Au Choix': { categories: ['Au Choix'], type: '' },
  'Batavia Arrack': { type: 'spirit' },
  'Beer (Double/Imperial Ipa)': {
    categories: ['Beer (Double/Imperial Ipa)'],
    type: 'beer',
  },
  'Beer (Schwarzbier)': { categories: ['Beer (Schwarzbier)'], type: 'beer' },
  'Beer (Sweet/Milk Stout)': { categories: ['Beer (Sweet/Milk Stout)'], type: 'beer' },
  'Beer (Vienna Lager)': { categories: ['Beer (Vienna Lager)'], type: 'beer' },
  'Beer (Witbier)': { categories: ['Beer (Witbier)'], type: 'beer' },
  Bénédictine: { type: 'liqueur' },
  'Bitters (Abbott)': { categories: ['Bitters (Abbott)'], type: 'bitter' },
  'Bitters (Apple)': { categories: ['Bitters (Apple)'], type: 'bitter' },
  'Bitters (Aromatic)': { categories: ['Bitters (Aromatic)'], type: 'bitter' },
  'Bitters (Becherovka)': { categories: ['Bitters (Becherovka)'], type: 'bitter' },
  'Bitters (Celery)': { categories: ['Bitters (Celery)'], type: 'bitter' },
  'Bitters (Cherry Bark And Vanilla)bitter': {
    categories: ['Bitters (Cherry Bark And Vanilla)'],
    type: 'bitter',
  },
  'Bitters (Chocolate)': { categories: ['Bitters (Chocolate)'], type: 'bitter' },
  'Bitters (Creole)': { categories: ['Bitters (Creole)'], type: 'bitter' },
  'Bitters (Gran Classico)': { categories: ['Bitters (Gran Classico)'], type: 'bitter' },
  'Bitters (Grapefruit)': { categories: ['Bitters (Grapefruit)'], type: 'bitter' },
  'Bitters (Jerry Thomas)': { categories: ['Bitters (Jerry Thomas)'], type: 'bitter' },
  'Bitters (Lavender)': { categories: ['Bitters (Lavender)'], type: 'bitter' },
  'Bitters (Orange)': { categories: ['Bitters (Orange)'], type: 'bitter' },
  'Bitters (Pimento)': { categories: ['Bitters (Pimento)'], type: 'bitter' },
  'Bitters (Tiki)': { categories: ['Bitters (Tiki)'], type: 'bitter' },
  'Blackberry Liqueur': { categories: ['Blackberry Liqueur'], type: '' },
  'Blood Orange Liqueur': { categories: ['Blood Orange Liqueur'], type: '' },
  'Brandy (Apple)': { categories: ['Brandy (Apple)'], type: '' },
  'Brandy (Cherry)': { categories: ['Brandy (Cherry)'], type: '' },
  'Brandy (Grape)': { categories: ['Brandy (Grape)'], type: '' },
  'Brandy (Pear)': { categories: ['Brandy (Pear)'], type: '' },
  'Brandy (Pisco)': { categories: ['Brandy (Pisco)'], type: '' },
  'Butter (Apple)': { categories: ['Butter (Apple)'], type: '' },
  'Butter (Pumpkin)': { categories: ['Butter (Pumpkin)'], type: '' },
  Cachaça: { categories: ['Cachaça'], type: 'spirit' },
  Champagne: { categories: ['Champagne'], type: 'wine' },
  'Green Chartreuse': { type: 'liqueur' },
  'Yellow Chartreuse': { type: 'liqueur' },
  'Cherry Heering': { categories: ['Cherry Heering'], type: 'liqueur' },
  'Cider (Apple)': { categories: ['Cider (Apple)'], type: 'beer' },
  'Cider (Pear)': { categories: ['Cider (Pear)'], type: 'beer' },
  'Club Soda': { type: 'soda' },
  'Coconut Liqueur': { categories: ['Coconut Liqueur'], type: 'liqueur' },
  'Cordial (Black Currant)': { categories: ['Cordial (Black Currant)'], type: '' },
  'Cordial (Kumquat)': { categories: ['Cordial (Kumquat)'], type: '' },
  'Cordial (Lime)': { categories: ['Cordial (Lime)'], type: '' },
  'Cream (Coconut)': { categories: ['Cream (Coconut)'], type: '' },
  'Cream Heavy': { type: 'other' },
  'Crème De Cacao (White)': { categories: ['Crème De Cacao (White)'], type: '' },
  'Crème De Cassis': { categories: ['Crème De Cassis'], type: '' },
  'Crème De Menthe': { categories: ['Crème De Menthe'], type: '' },
  'Crème De Violette': { categories: ['Crème De Violette'], type: '' },
  'Crème Yvette': { type: 'liqueur' },
  Drambuie: { type: 'liqueur' },
  'Egg (Whole?)': { categories: ['Egg (Whole?)'], type: '' },
  'Egg (White)': { categories: ['Egg (White)'], type: '' },
  'Egg (Whole)': { categories: ['Egg (Whole)'], type: '' },
  'Egg (Yolk)': { categories: ['Egg (Yolk)'], type: '' },
  'Elderflower Liqueur': { categories: ['Elderflower Liqueur'], type: 'liqueur' },
  Falernum: { categories: ['Falernum'], type: 'liqueur' },
  'Fruit (Apple)': { categories: ['Fruit (Apple)'], type: '' },
  'Fruit (Blackberry)': { categories: ['Fruit (Blackberry)'], type: '' },
  'Fruit (Cherry)': { categories: ['Fruit (Cherry)'], type: '' },
  'Fruit (Grape)': { categories: ['Fruit (Grape)'], type: '' },
  'Fruit (Lime)': { categories: ['Fruit (Lime)'], type: '' },
  'Fruit (Nectarine)': { categories: ['Fruit (Nectarine)'], type: '' },
  'Fruit (Orange)': { categories: ['Fruit (Orange)'], type: '' },
  'Fruit (Peach)': { categories: ['Fruit (Peach)'], type: '' },
  'Fruit (Pear)': { categories: ['Fruit (Pear)'], type: '' },
  'Fruit (Raspberry)': { categories: ['Fruit (Raspberry)'], type: '' },
  'Fruit (Strawberry)': { categories: ['Fruit (Strawberry)'], type: '' },
  'Fruit (Tangerine)': { categories: ['Fruit (Tangerine)'], type: '' },
  'Fruit (Tomato)': { categories: ['Fruit (Tomato)'], type: '' },
  Galliano: { categories: ['Galliano'], type: 'liqueur' },
  Gin: { categories: ['Gin'], type: '' },
  'Gin (American)': { categories: ['Gin (American)'], type: '' },
  'Gin (Genever)': { categories: ['Gin (Genever)'], type: '' },
  'Gin (London Dry)': { categories: ['Gin (London Dry)'], type: '' },
  'Gin (Old Tom)': { categories: ['Gin (Old Tom)'], type: '' },
  'Gin (Plymouth)': { categories: ['Gin (Plymouth)'], type: '' },
  'Gin (Sloe)': { categories: ['Gin (Sloe)'], type: '' },
  Grenadine: { categories: ['Grenadine'], type: '' },
  'Juice (Apple)': { categories: ['Juice (Apple)'], type: '' },
  'Juice (Blood Orange)': { categories: ['Juice (Blood Orange)'], type: '' },
  'Juice (Cantaloupe)': { categories: ['Juice (Cantaloupe)'], type: '' },
  'Juice (Celery)': { categories: ['Juice (Celery)'], type: '' },
  'Juice (Grapefruit)': { categories: ['Juice (Grapefruit)'], type: '' },
  'Juice (Lemon)': { categories: ['Juice (Lemon)'], type: '' },
  'Juice (Lime)': { categories: ['Juice (Lime)'], type: '' },
  'Juice (Orange)': { categories: ['Juice (Orange)'], type: '' },
  'Juice (Pineapple)': { categories: ['Juice (Pineapple)'], type: '' },
  'Juice (Watermelon)': { categories: ['Juice (Watermelon)'], type: '' },
  Kummel: { categories: ['Kummel'], type: '' },
  'Leaf (Basil)': { categories: ['Leaf (Basil)'], type: '' },
  'Leaf (Curry)': { categories: ['Leaf (Curry)'], type: '' },
  'Leaf (Kaffir Lime)': { categories: ['Leaf (Kaffir Lime)'], type: '' },
  'Leaf (Sage)': { categories: ['Leaf (Sage)'], type: '' },
  Liqueur: { type: 'liqueur' },
  Madeira: { categories: ['Madeira'], type: '' },
  'Maraschino/Cherry Liqueur': { categories: ['Maraschino/Cherry Liqueur'], type: '' },
  Mezcal: { categories: ['Mezcal'], type: '' },
  Mint: { categories: ['Mint'], type: '' },
  'Mix (Bergerac Mix)': { categories: ['Mix (Bergerac Mix)'], type: '' },
  'Mix (Donn’s Mix #1)': { categories: ['Mix (Donn’s Mix #1)'], type: '' },
  'Mix (Donn’s Spices #2)': { categories: ['Mix (Donn’s Spices #2)'], type: '' },
  'Mix (Pendennis Mix)': { categories: ['Mix (Pendennis Mix)'], type: '' },
  'Mix (Zombie Mix)': { categories: ['Mix (Zombie Mix)'], type: '' },
  'Orange Liqueur': { categories: ['Orange Liqueur'], type: '' },
  'Other (Acid Phosphate)': { categories: ['Other (Acid Phosphate)'], type: '' },
  'Other (Becherovka)': { categories: ['Other (Becherovka)'], type: '' },
  'Other (Cilantro)': { categories: ['Other (Cilantro)'], type: '' },
  'Other (Horchata)': { categories: ['Other (Horchata)'], type: '' },
  'Other (Hot Sauce)': { categories: ['Other (Hot Sauce)'], type: '' },
  'Other (Kirsch)': { categories: ['Other (Kirsch)'], type: '' },
  'Other (Lemon Curd)': { categories: ['Other (Lemon Curd)'], type: '' },
  'Other (Marmalade (Orange))': { categories: ['Other (Marmalade (Orange))'], type: '' },
  'Other (Orange Flower Water)': { type: 'other' },
  'Other (Rose Water)': { categories: ['Other (Rose Water)'], type: '' },
  'Other (Verjus)': { categories: ['Other (Verjus)'], type: '' },
  'Other (Vinegar)': { categories: ['Other (Vinegar)'], type: '' },
  'Other (Yogurt)': { categories: ['Other (Yogurt)'], type: '' },
  Pamplemousse: { categories: ['Pamplemousse'], type: '' },
  'Peach Liqueur': { categories: ['Peach Liqueur'], type: '' },
  'Pear Liqueur': { categories: ['Pear Liqueur'], type: '' },
  'Pine Liqueur': { categories: ['Pine Liqueur'], type: '' },
  'Pomegranate Molasses': { categories: ['Pomegranate Molasses'], type: '' },
  Port: { categories: ['Port'], type: '' },
  'Puree (Kalamansi)': { categories: ['Puree (Kalamansi)'], type: '' },
  'Puree (Pumpkin)': { categories: ['Puree (Pumpkin)'], type: '' },
  'Rim (Cinnamon Sugar)': { categories: ['Rim (Cinnamon Sugar)'], type: '' },
  'Rim (Spicy Sugar And Salt)': { categories: ['Rim (Spicy Sugar And Salt)'], type: '' },
  'Rim (Toasted Fennel Salt)': { categories: ['Rim (Toasted Fennel Salt)'], type: '' },
  'Rose Liqueur': { categories: ['Rose Liqueur'], type: '' },
  'Rum (Agricole Ambre)': { categories: ['Rum (Agricole Ambre)'], type: '' },
  'Rum (Agricole Blanc)': { categories: ['Rum (Agricole Blanc)'], type: '' },
  'Rum (Demerara Overproof)': { categories: ['Rum (Demerara Overproof)'], type: '' },
  'Rum (Demerara)': { categories: ['Rum (Demerara)'], type: '' },
  'Rum (English White)': { categories: ['Rum (English White)'], type: '' },
  'Rum (English)': { categories: ['Rum (English)'], type: '' },
  'Rum (Jamaican White)': { categories: ['Rum (Jamaican White)'], type: '' },
  'Rum (Jamaican)': { categories: ['Rum (Jamaican)'], type: '' },
  'Rum (Spanish White)': { categories: ['Rum (Spanish White)'], type: '' },
  'Rum (Spanish)': { categories: ['Rum (Spanish)'], type: '' },
  Salt: { categories: ['Salt'], type: '' },
  Sherry: { categories: ['Sherry'], type: '' },
  'Sherry (Amontillado)': { categories: ['Sherry (Amontillado)'], type: '' },
  'Sherry (Cream)': { categories: ['Sherry (Cream)'], type: '' },
  'Sherry (Manzanilla)': { categories: ['Sherry (Manzanilla)'], type: '' },
  'Sherry (Oloroso)': { categories: ['Sherry (Oloroso)'], type: '' },
  'Sherry (Pale Cream)': { categories: ['Sherry (Pale Cream)'], type: '' },
  Shrub: { categories: ['Shrub'], type: '' },
  'Soda (Grapefruit)': { categories: ['Soda (Grapefruit)'], type: '' },
  'Spice (Cardamom Pods)': { categories: ['Spice (Cardamom Pods)'], type: '' },
  'Spice (Cinnamon)': { categories: ['Spice (Cinnamon)'], type: '' },
  'Spice (Nutmeg)': { categories: ['Spice (Nutmeg)'], type: '' },
  'Strawberry Liqueur': { categories: ['Strawberry Liqueur'], type: '' },
  Strega: { categories: ['Strega'], type: '' },
  Sugar: { categories: ['Sugar'], type: '' },
  'Sugar Cube': { categories: ['Sugar Cube'], type: '' },
  Suze: { categories: ['Suze'], type: '' },
  'Swedish Punsch': { categories: ['Swedish Punsch'], type: '' },
  'Syrup (Agave Nectar)': { categories: ['Syrup (Agave Nectar)'], type: '' },
  'Syrup (Agave)': { categories: ['Syrup (Agave)'], type: '' },
  'Syrup (Apple)': { categories: ['Syrup (Apple)'], type: '' },
  'Syrup (Banana)': { categories: ['Syrup (Banana)'], type: '' },
  'Syrup (Blueberry)': { categories: ['Syrup (Blueberry)'], type: '' },
  'Syrup (Cane Sugar)': { categories: ['Syrup (Cane Sugar)'], type: '' },
  'Syrup (Cinnamon)': { categories: ['Syrup (Cinnamon)'], type: '' },
  'Syrup (Cumin)': { categories: ['Syrup (Cumin)'], type: '' },
  'Syrup (Demerara)': { categories: ['Syrup (Demerara)'], type: '' },
  'Syrup (Gastrique)': { categories: ['Syrup (Gastrique)'], type: '' },
  'Syrup (Ginger)': { categories: ['Syrup (Ginger)'], type: '' },
  'Syrup (Hibiscus)': { categories: ['Syrup (Hibiscus)'], type: '' },
  'Syrup (Honey)': { categories: ['Syrup (Honey)'], type: '' },
  'Syrup (Maple)': { categories: ['Syrup (Maple)'], type: '' },
  'Syrup (Orgeat)': { categories: ['Syrup (Orgeat)'], type: '' },
  'Syrup (Passion Fruit)': { categories: ['Syrup (Passion Fruit)'], type: '' },
  'Syrup (Rich)': { categories: ['Syrup (Rich)'], type: '' },
  'Syrup (Scarlet Glow Tea)': { categories: ['Syrup (Scarlet Glow Tea)'], type: '' },
  'Syrup (Simple)': { categories: ['Syrup (Simple)'], type: '' },
  'Syrup (Vanilla)': { categories: ['Syrup (Vanilla)'], type: '' },
  'Tequila (Anejo)': { categories: ['Tequila (Anejo)'], type: '' },
  'Tequila (Blanco)': { categories: ['Tequila (Blanco)'], type: '' },
  'Tequila (Reposado)': { categories: ['Tequila (Reposado)'], type: '' },
  'Twist (Grapefruit)': { categories: ['Twist (Grapefruit)'], type: '' },
  'Twist (Lemon)': { categories: ['Twist (Lemon)'], type: '' },
  'Twist (Orange)': { categories: ['Twist (Orange)'], type: '' },
  'Vegetable (Cucumber)': { categories: ['Vegetable (Cucumber)'], type: '' },
  'Vermouth (Blanc)': { categories: ['Vermouth (Blanc)'], type: 'wine' },
  'Vermouth (Dry)': { categories: ['Vermouth (Dry)'], type: 'wine' },
  'Vermouth (Sweet)': { categories: ['Vermouth (Sweet)'], type: 'wine' },
  Vodka: { categories: ['Vodka'], type: 'spirit' },
  'Vodka (Chocolate)': { categories: ['Vodka (Chocolate)'], type: 'spirit' },
  'Water (Coconut)': { type: 'other' },
  'Whiskey (Bourbon)': { categories: ['Whiskey (Bourbon)'], type: 'spirit' },
  'Whiskey (Irish)': { categories: ['Whiskey (Irish)'], type: 'spirit' },
  'Whiskey (Japanese)': { categories: ['Whiskey (Japanese)'], type: 'spirit' },
  'Whiskey (Oat)': { categories: ['Whiskey (Oat)'], type: 'spirit' },
  'Whiskey (Rye)': { categories: ['Whiskey (Rye)'], type: 'spirit' },
  'Whiskey (Scotch)': { categories: ['Whiskey (Scotch)'], type: 'spirit' },
  'Whiskey (Wheat)': { categories: ['Whiskey (Wheat)'], type: 'spirit' },
  'Wine (Red)': { categories: ['Wine (Red)'], type: 'wine' },
  'Wine (Sparkling Rosé)': { categories: ['Wine (Sparkling Rosé)'], type: 'wine' },
  'Wine (White)': { categories: ['Wine (White)'], type: 'wine' },
};

const getCategory = (record) => record[0];
const getRecipeName = (record) => record[1];
const getPage = (record) => record[2];
const getIngredientName = (record) => record[3];

const processFile = async () => {
  const records = [];
  const missingIngredients = new Set();
  const missingCategories = new Set();
  const parser = createReadStream(path.join(__dirname, '../../raw/deathco.csv')).pipe(
    parse({
      // CSV options if any
      delimiter: '	',
    }),
  );
  for await (const record of parser) {
    // Work with each record
    records.push(record);
    const ingredientName = getIngredientName(record);
    const categoryName = getCategory(record);

    if (ingredientName !== 'notes' && !(ingredientName in INGREDIENT_MAP))
      missingIngredients.add(ingredientName);
    if (categoryName !== 'ingredient' && !(categoryName in CATEGORY_NAME_MAP))
      missingCategories.add(categoryName);
  }

  // if (missingIngredients.size > 0) {
  //   console.log('Missing ingredients:');
  //   console.log(missingIngredients);
  // }

  if (missingCategories.size > 0) {
    console.log('Missing categories:');
    console.log(missingCategories);
  }

  const groupedByRecipe = Object.groupBy(
    // Skip the first record
    records.slice(1),
    (record) => getRecipeName(record),
  );
  for await (const [recipeName, ingredients] of Object.entries(groupedByRecipe)) {
    const recipe = {
      $schema: '../../../../schemas/recipe.schema.json',
      name: _.capitalize(recipeName),
      preparation: 'TODO',
      served_on: 'TODO',
      glassware: 'TODO',
      ingredients: ingredients
        .map((record) => {
          const data = INGREDIENT_MAP[getIngredientName(record)];
          if (data === false) return false;

          return {
            name: getIngredientName(record),
            type: getCategory(record),
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
          page: parseInt(getPage(ingredients[0]), 10),
          title: 'death-co',
        },
      ],
    };

    // console.log(`${slugify(recipeName)}.json`, recipe.ingredients);
    // await writeJSON(path.join(root, `${slugify(recipeName)}.json`), recipe);
  }
};

await processFile();
