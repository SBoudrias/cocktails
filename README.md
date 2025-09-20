# Cocktail Index

Hobbyist bartender web app. Project initiated from my slight frustration towards the lack of indexes in most cocktail books.

This app has a heavy Tiki bias, and is a hobby project built for my own needs - e.g. advanced use cases rather than aimed at beginners. That being said, contributions of any useful features are more than welcomed!

A few features:

- Rich recipe collection, focused on quality (e.g. all recipes are part of this project, no low quality recipe data from 3rd parties)
- Recipes tries to list specific bottles used at bars whenever the information is available. Rum bottles in particular are then classified loosely following the Smuggler's Cove rum classification system. Category pages are listing substitution options.
- Ingredients also have recipes when available; this includes known rum blends.
- Some useful calculators around acid adjusting, sugar adjusting, saline solution, etc.
- As an index, it is meant to be searchable by ingredients, bars, bartender, etc.

## Getting Started

Install dependencies with yarn

```bash
yarn install
```

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000/cocktails](http://localhost:3000/cocktails) with your browser to see the result.

## Creating new recipes

Recipes are stored in `.json` files under `src/data/recipes/[type]/[source]/[slug].json`, and are nested under their source (book, youtube channel, etc.) The file name should be a url safe slug of the recipe name.

Each recipe file should start by defining it's schema:

```json
{
  "$schema": "../../../../schemas/recipe.schema.json",
  "name": "TODO"
}
```

The format of recipes is defined in `src/schemas/recipe.schema.json`. Not all fields are required (like `instructions` or `attributions`.) If you're not sure, put `FIXME` as value and I'll fix them manually. Please do check if the ingredients are already defined inside `src/data/ingredients/**`, names are often similar and we want to reuse the defined names whenever possible.

You can validate the new files are valid by running `yarn check-data`.

Here's a few common conventions:

1. Use `tsp` when a recipe call for a barspoon.
2. When an ingredient listed is generic use "category" as its type. Only use spirit, liqueur, etc when a specific bottle/brand is called for.
3. When a recipe list multiple options (A or B), pick one.
4. Prefer using `oz` or other imperial metrics in the recipe file (not `ml`.)
5. Only document garnishes in the `instructions` section

### Syrups & Brix

Do not use "rich" or "semi-rich" in syrup names. Instead, define the brix level of the specific syrup.

- Rich: 66 brix
- Semi Rich: 60 brix

Add the brix level of a syrup when known. That way users will be able to adjust to match own home bar syrup concentration.
