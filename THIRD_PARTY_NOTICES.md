# Third-party notices

## License inventory

| Source | License | Where it is used | Obligations |
| --- | --- | --- | --- |
| USDA FoodData Central, SR Legacy (April 2018) | CC0-1.0 (public domain dedication) | `packages/nutrition-engine/src/foods.generated.ts` (333 verified foods) | None legally required; citation requested (see the USDA section). Keep per-item source, license, date and unit. |
| Open Food Facts | ODbL-1.0 (database), DbCL-1.0 (contents), CC BY-SA 3.0 (images) | Barcode lookup only; no database dump is bundled | Attribute Open Food Facts; share-alike applies to the database and derivative databases; images under CC BY-SA 3.0 require attribution and share-alike. |
| GymCoach | MIT | `packages/training-engine/src/programs.ts` (adapted program templates) | Keep the copyright and permission notice (reproduced below). |
| StrongerFit own foods | Own data, not third-party | `packages/nutrition-engine/data/unverified-foods.json` (14 foods) | Marked `verified: false`; not attributed to USDA nor covered by its dedication. |

StrongerFit includes material adapted from the following projects.

## GymCoach

- Project: https://github.com/gymcoach-app/gymcoach
- File: `lib/programs/templates.ts` (retrieved 2026-11-04)
- Used in: `packages/training-engine/src/programs.ts`
- Changes: program structure (days, sets, rep ranges, RIR, rest) transcribed to
  StrongerFit's own exercise catalog, texts translated to Spanish, cable and
  pull-up exercises mapped to the closest catalog equivalent, nSuns omitted.

```
MIT License

Copyright (c) 2026 GymCoach contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Program names (5/3/1, GZCLP, Starting Strength, StrongLifts 5×5, Madcow 5×5,
PHUL, PHAT) identify the original authors' programs. The versions in StrongerFit
are unofficial transcriptions and do not imply endorsement.

## USDA FoodData Central

- Source: https://fdc.nal.usda.gov/
- Dataset: SR Legacy, April 2018; imported 2026-11-09 and 2026-11-26.
- Used in: `packages/nutrition-engine/src/foods.generated.ts` (333 foods: 237 imported 2026-11-09, 96 imported 2026-11-26).
- License: CC0 1.0 Universal, public domain:
  https://creativecommons.org/publicdomain/zero/1.0/
- Licensing and requested attribution: https://fdc.nal.usda.gov/api-guide/#bkmk-9

> U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.

Nutrient values per 100 g are imported without estimation. Spanish names, roles,
meal slots, portions, pairings and restriction tags are StrongerFit curation.
Per-food FDC IDs and source metadata, including each food's own import date
(`provenance.importedAt`), are retained. Local unverified foods are
identified separately and are not attributed to USDA or covered by its dedication.
Foundation Foods October 2026 was consulted for equivalence review only; no
Foundation nutrient records were incorporated. See `docs/architecture/nutrition.md`
and `packages/nutrition-engine/data/usda-release.json` for reproduction and hashes.

## Open Food Facts

Contains information from Open Food Facts, available under the Open Database
License (ODbL) 1.0: https://opendatacommons.org/licenses/odbl/1-0/

- Project and contributors: https://world.openfoodfacts.org/
- Used in: `frontend/src/features/nutrition/openfoodfacts.ts`, barcode lookup.
- License documentation:
  https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/
- Individual database contents: Database Contents License (DbCL) 1.0,
  https://opendatacommons.org/licenses/dbcl/1.0/
- Product images, if used: CC BY-SA 3.0,
  https://creativecommons.org/licenses/by-sa/3.0/

The barcode integration retains its attribution and remains separate from the
USDA generic catalog. No bulk Open Food Facts database is bundled by this import.
