---
description: Create recipes from photos
---

I'll send you a series of photos from a book. I want you to read those images and transform them in new recipes json files following the JSON schema define inside @src/schemas/recipe.schema.json. If a JSON file doesn't yet exist, create a new one.

Make sure to ask me which book the photos are from so you can select the right folder to add recipes to.

Some rules to keep in mind:

- Put the book in the refs array, not the attribution.
- When possible, use the specific "recommended spirits" bottles instead of the generic names within the recipe. When not using a specific bottle, the type should be "category" instead of "spirit" or "liqueur".
- Document ganishes in the instructions, not the recipe itself.

See @README.md for further instruction on normalizing recipe files.
