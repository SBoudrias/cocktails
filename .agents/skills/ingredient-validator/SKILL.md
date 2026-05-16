---
name: ingredient-validator
description: Validate cocktail ingredient names, types, categories, and recipe ingredient references against the Cocktail Index data. Use when creating or modifying recipes or ingredients to prevent duplicates, reuse canonical names, and avoid modeling techniques as bottles.
---

# Ingredient Validator

Maintain ingredient data consistency when creating or modifying recipes and ingredients.

## Validation Workflow

1. Search existing ingredients in `packages/data/data/ingredients/*/**` before accepting or creating ingredient names.
2. Use the exact existing ingredient name when one already exists. Prefer database consistency over user-provided naming.
3. Check nearby ingredient files and `packages/data/schemas/ingredient.schema.json` before creating or changing ingredient data.
4. Verify categories against existing category files in `packages/data/data/categories/`.
5. Run `yarn check-data` after ingredient or recipe data edits.

## Matching Rules

- Look for similar names, common variations, spelling differences, and likely aliases. Examples include `lime juice` vs `fresh lime juice`, or `simple syrup` vs `sugar syrup`.
- Drop redundant words like `spirit`, `liqueur`, or `wine` from ingredient names when that word is already represented by the ingredient type or categories.
- Keep those words when they are part of an appellation, denomination, or brand/product name.
- Sherries, aromatized wines such as vermouths and quinquinas, and ports use type `wine`, not `liqueur`.
- If uncertain whether an ingredient exists or what type it should use, check the current ingredient data before proceeding and state the uncertainty explicitly.

## Techniques Are Not Bottles

Infused, fat-washed, tea-infused, pepper-infused, milk-washed, and similarly modified spirits are recipe techniques, not separate ingredients.

When a recipe calls for something like `Chamomile-Infused Armagnac`, reference the base ingredient and add a technique object:

```json
{
  "name": "Chateau du Tariquet 15 Year Armagnac",
  "technique": {
    "technique": "infusion",
    "agent": "chamomile"
  }
}
```

Do not create ingredient files for modified spirits unless the underlying base ingredient itself is missing. See `packages/data/schemas/technique.schema.json` for supported technique shapes.

## Known Renames

Always search thoroughly before creating new bottles. Known product renames include:

- `Appleton Estate Reserve` -> `Appleton 8` (`appleton-8.json`)
- `Appleton Estate V/X` -> `Appleton Signature` (`appleton-signature.json`)

## Output Expectations

Be decisive and specific. Reference the exact ingredient names and files you found, flag likely duplicates or type mistakes immediately, and recommend the canonical data shape to use.
