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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Creating new recipes

Recipes are stored in `.json` files under `src/data/recipes`, and are nested under their source (book, youtube channel, etc.) The file name should be a url safe slug of the recipe name.

Each recipe file should start by defining it's schema:

```json
{
  "$schema": "../../../../schemas/recipe.schema.json",
  "name": "TODO"
}
```

The format of recipes is defined in `src/schemas/recipe.schema.json`. Not all fields are required (like `instructions` or `attributions`.) If you're not sure, put TODO as value and I'll fix them manually. Please do check if the ingredients are already defined inside `src/data/ingredients/**` and when possible reuse the defined names.

You can validate the new files are valid by running `yarn check-data`.

Here's a few common conventions:

1. Use `tsp` when a recipe call for a barspoon.
2. When a recipe list multiple options (A or B), pick one.
3. Favour using `oz` or other imperial metrics in the recipe file (not `ml`.)

### Syrups & Brix

Do not use "rich" or "semi-rich" in syrup names. Instead, define the brix level of the specific syrup.

- Rich: 66 brix
- Semi Rich: 60 brix

Add the brix level of a syrup when known. That way users will be able to adjust to match own home bar syrup concentration.
