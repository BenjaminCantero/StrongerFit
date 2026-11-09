export const FOOD_CATALOG_VERSION = 'usda-sr-2018-04-cl-1';

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number };
export type FoodRole = 'protein' | 'dairy' | 'carb' | 'veg' | 'fruit' | 'fat';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
// Etiquetas de restricción: alérgenos y grupos que una exclusión o dieta puede bloquear.
// 'lacteo' marca todo derivado de leche (incluso sin lactosa); 'lactosa' solo lo que la contiene.
export type FoodTag = 'gluten' | 'lactosa' | 'lacteo' | 'frutos-secos' | 'mani' | 'huevo' | 'pescado' | 'mariscos' | 'soya' | 'carne' | 'animal';

export type CatalogFood = {
  id: string; name: string; per100g: Nutrients; servingGrams: number; defaultGrams: number; pairingIds: string[];
  verified: boolean; provenance: FoodProvenance;
  role: FoodRole; meals: MealSlot[]; tags: FoodTag[];
};

export type FoodProvenance =
  | { source: 'USDA FoodData Central'; fdcId: number; dataset: 'SR Legacy' | 'Foundation'; version: string; license: 'CC0-1.0'; importedAt: string }
  | { source: 'StrongerFit'; dataset: string; version: string; license: string; importedAt: string; reason: string };

export { foodCatalog } from './foods.generated';
