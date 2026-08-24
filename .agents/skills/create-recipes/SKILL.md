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

- **Recipe naming / parentheses**: A parenthetical in a recipe name is reserved
  for authorship attribution — an original recipe or a named adaptation — and
  only when it needs to be distinguished from another version of the same drink
  **within the same source/channel**. Do not use a channel or source name in
  parentheses to label a version of a classic cocktail (e.g. avoid `Mai Tai
(Make and Drink)`); that wrongly implies the channel authored the recipe. Only
  versions that **diverge from the accepted/common industry recipe** need
  disambiguation — the accepted recipe itself uses the plain name directly
  (e.g. `Ramos Gin Fizz` + `Ramos Gin Fizz (7 Up)`, `Nui Nui` + `Nui Nui
(Holiday)`). Disambiguate divergent versions with numbering (`no. 1`, `no.
2`), provenance (the bar, book, or author behind that version), or a date
  only when the date is a meaningful version identifier (e.g. a historical
  recipe year like `Zombie (1930)`) — never the video upload year. Drop the
  parenthetical entirely when there is only one version of that drink in the
  source.

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
- Do not use `House` as an ingredient-name prefix. It is ambiguous outside the
  source context. Namespace source-specific house ingredients to their source,
  for example `Death & Co Horchata`, while preserving the source wording in
  extraction notes.
- Watch for renamed products and search before creating new bottles. Examples:
  - `Appleton Estate Reserve` is now `Appleton 8`
  - `Appleton Estate V/X` is now `Appleton Signature`
- Prefer existing project conventions from similar recipe files over inventing new shapes.
- If required details are missing, use `FIXME` rather than guessing.
