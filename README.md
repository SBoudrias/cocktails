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

Recipes are stored in `.json` files under `packages/data/data/recipes/[type]/[source]/[slug].json`, and are nested under their source (book, youtube channel, etc.) The file name should be a url safe slug of the recipe name.

Before adding a new recipe, please check if it already exists in the database. If it does, update the existing recipe instead of creating a new one. With youtube channel in particular, we often see the same recipes uploaded by multiple channels or videos. When the recipe exists, just add the video to the `refs` array of the existing recipe. If the recipe differs somewhat, create a new recipe with a different slug.

Each recipe file should start by defining it's schema:

```json
{
  "$schema": "../../../../schemas/recipe.schema.json",
  "name": "FIXME"
}
```

The format of recipes is defined in `packages/data/schemas/recipe.schema.json`, reference `$schema` to that file with a relative path. Not all fields are required (like `instructions` or `attributions`.) If you're not sure, put `FIXME` as value and I'll fix them manually. Please do check if the ingredients are already defined inside `packages/data/data/ingredients/**`, names are often similar and we want to reuse the defined names whenever possible.

You can validate the new files are valid by running `yarn check-data`.

Here's a few common conventions:

1. Use `tsp` when a recipe call for a barspoon.
2. When an ingredient listed is generic use "category" as its type. Only use spirit, liqueur, wine, etc when a specific bottle/brand is called for.
3. When a recipe list multiple options (A or B), pick one.
4. Prefer using `oz` or other imperial metrics in the recipe file (not `ml`.)
5. Only document garnishes in the `instructions` section. Citrus peels that are muddled or infused should use the fruit (e.g., `orange`, `lemon`) with technique `{"technique": "cut", "type": "peeled"}`.
6. A "Zombie glass" is a collins glass
7. Substitute mixes with their component ingredients:
   - Don's mix: replace with 2 parts grapefruit juice & 1 part cinnamon syrup
   - Don's spices no. 2: replace with 1 part vanilla syrup & 1 part allspice dram
8. Use "seltzer" instead of "club soda" or "soda water" for carbonated water

### Creating new ingredients

1. **Always search before creating.** Many ingredients exist with different names. Use the `ingredient-validator` agent or search `src/data/ingredients/**` first.
2. **Spirits, liqueurs, and wines must have categories.** Check `src/data/categories/` for valid category names.

### Syrups & Brix

Do not use "rich" or "semi-rich" in syrup names. Instead, define the brix level of the specific syrup.

- Rich: 66 brix
- Semi Rich: 60 brix

Add the brix level of a syrup when known. That way users will be able to adjust to match own home bar syrup concentration.
