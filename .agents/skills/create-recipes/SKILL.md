---
name: create-recipes
description: Create cocktail recipe JSON files for the Cocktail Index from user-provided recipes, batches, books, videos, or notes. Use when adding new recipes, converting recipe text into data files, or backfilling recipes from YouTube or another source.
---

# Create Cocktail Recipes

Create recipe files in the right `packages/data/data/recipes/[type]/[source]/[slug].json` location, following `packages/data/schemas/recipe.schema.json` and the project conventions in `README.md` and `AGENTS.md`.

## Workflow

1. Read the relevant schema and nearby recipe/source files before writing new JSON.
2. Search existing recipes first. If the recipe already exists, update it instead of creating a duplicate.
3. Search existing ingredients before adding or naming ingredient references. Reuse the existing ingredient names whenever possible.
4. If the user provides YouTube URLs, use the `youtube` skill to fetch video metadata and extract recipe-relevant notes before writing recipe files.
5. For tricky ingredient matching, use the `ingredient-validator` skill.
6. Run `yarn check-data` after edits. This may autofix data formatting.

## Recipe Rules

- Infused, fat-washed, tea-infused, pepper-infused, and similar modified spirits are techniques, not separate bottles. Use the base ingredient with a `technique` object, for example:

  ```json
  {
    "name": "Chateau du Tariquet 15 Year Armagnac",
    "technique": {
      "technique": "infusion",
      "agent": "chamomile"
    }
  }
  ```

- Do not create ingredient files for infused or otherwise modified spirits unless the underlying base ingredient itself is missing.
- Watch for renamed products and search before creating new bottles. Examples:
  - `Appleton Estate Reserve` is now `Appleton 8`
  - `Appleton Estate V/X` is now `Appleton Signature`
- Prefer existing project conventions from similar recipe files over inventing new shapes.
- If required details are missing, use `FIXME` rather than guessing.
