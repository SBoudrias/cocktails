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

## Category Deduplication

The same product class must never exist under two category names. Before creating a category in `packages/data/data/categories/`, search for the same product under its other common names — especially French/English equivalents:

| Canonical category | Do NOT create a second category as                    |
| ------------------ | ----------------------------------------------------- |
| Crème de Mûre      | Blackberry liqueur (mûre = blackberry)                |
| Crème de Cassis    | Blackcurrant liqueur (cassis = blackcurrant)          |
| Crème de Cacao     | Chocolate liqueur                                     |
| Crème de Menthe    | Mint liqueur                                          |
| Crème de Violette  | Violet liqueur                                        |
| Triple Sec         | Orange liqueur (it is a child of it, not a duplicate) |

- French `Crème de X` appellations are the canonical category names for that product class, even when a recipe says the English name. Reference the existing category — e.g. a recipe calling for "blackberry liqueur" uses `Crème de Mûre` with `type: "category"`.
- Use `parents` for genuine subtypes (e.g. `Orange Curaçao` and `Triple Sec` have parent `Orange Liqueur`), never for synonyms.
- A generic parent category may group substitution-friendly variants so a recipe can accept any of them (e.g. `Falernum` with children `Falernum liqueur` and `Falernum syrup` — substitute one for the other and adjust proportions). The parent link must be declared via `parents`; that is what distinguishes an intentional hierarchy from a duplicate.
- `yarn check-data` warns when two same-type categories differ only by a trailing generic word ("X" vs "X liqueur") unless one is declared as the other's parent, and auto-fixes category-name casing to canonical names — but it cannot catch translation duplicates like Crème de Mûre / Blackberry liqueur, so always search first.

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
