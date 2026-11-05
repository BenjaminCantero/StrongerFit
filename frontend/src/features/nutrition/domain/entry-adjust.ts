import { sumNutrients, type Food, type FoodEntry, type MealId } from './food-entry';

// Registros que no vienen del catálogo (código de barras `off:…`, foto `photo:…`) no
// pueden abrirse en el formulario de búsqueda. Se editan ajustando los gramos de cada
// ítem y la comida; los nutrientes se reescalan desde lo que se guardó al registrar.

export const MIN_ITEM_GRAMS = 1;
export const MAX_ITEM_GRAMS = 2000;

export function isExternalEntry(entry: FoodEntry, foods: readonly Food[]): boolean {
  const ids = new Set(foods.map((food) => food.id));
  return entry.items.some((item) => !ids.has(item.foodId));
}

export function sourceLabel(foodId: string): string {
  if (foodId.startsWith('off:')) return 'Código de barras';
  if (foodId.startsWith('photo:')) return 'Foto del plato';
  return 'Catálogo';
}

export function clampItemGrams(grams: number): number {
  return Math.min(MAX_ITEM_GRAMS, Math.max(MIN_ITEM_GRAMS, Math.round(grams)));
}

export function rescaleEntry(entry: FoodEntry, grams: readonly number[], meal: MealId): FoodEntry | null {
  if (grams.length !== entry.items.length || grams.some((value) => !Number.isFinite(value) || value < MIN_ITEM_GRAMS || value > MAX_ITEM_GRAMS)) return null;
  const items = entry.items.map((item, index) => {
    const factor = grams[index]! / item.grams;
    return { ...item, grams: grams[index]!, nutrients: { kcal: item.nutrients.kcal * factor, protein: item.nutrients.protein * factor,
      carbs: item.nutrients.carbs * factor, fat: item.nutrients.fat * factor } };
  });
  return { ...entry, meal, items, nutrients: sumNutrients(items.map((item) => item.nutrients)) };
}
