You're in charge of creating new recipes. I'll send you recipes in batches and you'll be creating the files in the right folders following the schema defined in `packages/data/schemas/recipe.schema.json`.

Don't forget:

1. Get help from the ingredient-validator sub-agent.
2. Use the youtube skill if I give you youtube.com links
3. **Infused spirits are techniques, NOT separate bottles.** When a recipe calls for something like "Chamomile-Infused Armagnac", use the base spirit (e.g., "Château du Tariquet 15 Year Armagnac") with `"technique": {"technique": "infusion", "agent": "chamomile"}`. Never create ingredient files for infused spirits. Same applies to fat-washed, tea-infused, pepper-infused, etc.
4. **Watch out for renamed products.** Some spirit brands have been renamed over time (e.g., "Appleton Estate Reserve" → "Appleton 8", "Appleton Estate V/X" → "Appleton Signature"). Always search existing ingredient files before creating new ones.
