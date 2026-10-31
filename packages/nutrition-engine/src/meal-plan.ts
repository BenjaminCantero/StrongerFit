import { foodCatalog, FOOD_CATALOG_VERSION, type CatalogFood, type FoodRole, type FoodTag, type MealSlot, type Nutrients } from './foods';

// Minuta semanal por combinación de alimentos (RF-12, SRS 10.2). Determinista: los mismos
// datos producen la misma minuta. Las recetas completas quedan para una versión posterior.
export const MEAL_PLAN_RULE_VERSION = 'minuta-0.1';
export const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
// Reparto de la energía diaria por comida (referencia inicial, BR-09).
export const mealShares: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };
export const DEFAULT_TOLERANCE = 0.1;

const templates: Record<MealSlot, FoodRole[]> = {
  breakfast: ['carb', 'dairy', 'fruit'],
  lunch: ['protein', 'carb', 'veg', 'fat'],
  snack: ['dairy', 'fruit'],
  dinner: ['protein', 'veg', 'carb', 'fat'],
};
// Si una dieta deja un rol sin opciones se intenta el siguiente; nunca se ignora una exclusión.
const fallbacks: Partial<Record<FoodRole, FoodRole[]>> = { dairy: ['protein', 'fat'] };

export type Restrictions = { tags: FoodTag[]; names: string[]; unmatched: string[]; diet: 'vegan' | 'vegetarian' | null };
export type PlanItem = { foodId: string; name: string; role: FoodRole; grams: number; nutrients: Nutrients };
export type PlannedMeal = { meal: MealSlot; targetKcal: number; items: PlanItem[]; nutrients: Nutrients };
export type PlannedDay = { index: number; meals: PlannedMeal[]; totals: Nutrients; deviation: number };
export type MealPlan = {
  ruleVersion: string; catalogVersion: string; targets: Nutrients; tolerance: number; restrictions: Restrictions; days: PlannedDay[];
};
export type MealPlanInput = { targets: Nutrients; exclusions: string[]; dietFocus: string; tolerance?: number; foods?: CatalogFood[] };
export type MealPlanResult = { ok: true; plan: MealPlan } | { ok: false; blocked: { meal: MealSlot; role: FoodRole }[]; restrictions: Restrictions };

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const synonyms: [RegExp, FoodTag[]][] = [
  [/gluten|trigo|celiac|celiaq/, ['gluten']], [/lactosa/, ['lactosa']], [/lacteo|leche/, ['lactosa', 'lacteo']],
  [/frutos? secos?|nuez|nueces|almendra/, ['frutos-secos']], [/\bmani\b|cacahuate/, ['mani']], [/huevo/, ['huevo']],
  [/pescado/, ['pescado']], [/marisco|camaron/, ['mariscos']], [/soya|soja/, ['soya']],
];

// Exclusiones en texto libre: se reconocen alérgenos conocidos o, si no, nombres de alimentos.
export function resolveRestrictions(exclusions: string[], dietFocus: string, foods = foodCatalog): Restrictions {
  const tags = new Set<FoodTag>();
  const names: string[] = [];
  const unmatched: string[] = [];
  for (const exclusion of exclusions) {
    const text = normalize(exclusion);
    if (!text) continue;
    const found = synonyms.filter(([pattern]) => pattern.test(text)).flatMap(([, value]) => value);
    if (found.length) found.forEach((tag) => tags.add(tag));
    else if (foods.some((food) => normalize(food.name).includes(text))) names.push(text);
    else unmatched.push(exclusion.trim());
  }
  const focus = normalize(dietFocus);
  const diet = /vegan/.test(focus) ? 'vegan' : /vegetarian/.test(focus) ? 'vegetarian' : null;
  if (diet === 'vegan') tags.add('animal');
  if (diet) (['carne', 'pescado', 'mariscos'] as const).forEach((tag) => tags.add(tag));
  return { tags: [...tags], names, unmatched, diet };
}

export const isAllowed = (food: CatalogFood, restrictions: Restrictions) =>
  !food.tags.some((tag) => restrictions.tags.includes(tag)) && !restrictions.names.some((name) => normalize(food.name).includes(name));

const round1 = (value: number) => Math.round(value * 10) / 10;
const round5 = (grams: number) => Math.max(5, Math.round(grams / 5) * 5);
const clampGrams = (food: CatalogFood, grams: number) => round5(Math.min(food.servingGrams * 2.5, Math.max(food.servingGrams * 0.5, grams)));

export function nutrientsFor(food: CatalogFood, grams: number): Nutrients {
  const ratio = grams / 100;
  return { kcal: round1(food.per100g.kcal * ratio), protein: round1(food.per100g.protein * ratio),
    carbs: round1(food.per100g.carbs * ratio), fat: round1(food.per100g.fat * ratio) };
}

export function addNutrients(list: Nutrients[]): Nutrients {
  return list.reduce((total, item) => ({ kcal: round1(total.kcal + item.kcal), protein: round1(total.protein + item.protein),
    carbs: round1(total.carbs + item.carbs), fat: round1(total.fat + item.fat) }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

const item = (food: CatalogFood, grams: number): PlanItem => ({ foodId: food.id, name: food.name, role: food.role, grams, nutrients: nutrientsFor(food, grams) });

function candidates(foods: CatalogFood[], restrictions: Restrictions, meal: MealSlot, role: FoodRole) {
  for (const option of [role, ...(fallbacks[role] ?? [])]) {
    const list = foods.filter((food) => food.role === option && food.meals.includes(meal) && isAllowed(food, restrictions));
    if (list.length) return list;
  }
  return [];
}

// Porciones: las verduras quedan en su porción habitual y el resto se escala hacia la meta de la comida.
function portion(foods: CatalogFood[], targetKcal: number): PlanItem[] {
  const fixed = foods.filter((food) => food.role === 'veg');
  const fixedKcal = fixed.reduce((total, food) => total + nutrientsFor(food, food.servingGrams).kcal, 0);
  const scalable = foods.filter((food) => food.role !== 'veg');
  const base = scalable.reduce((total, food) => total + nutrientsFor(food, food.servingGrams).kcal, 0);
  const factor = base > 0 ? Math.max(0, targetKcal - fixedKcal) / base : 1;
  return foods.map((food) => item(food, food.role === 'veg' ? food.servingGrams : clampGrams(food, food.servingGrams * factor)));
}

function buildDay(index: number, meals: PlannedMeal[], targets: Nutrients): PlannedDay {
  const totals = addNutrients(meals.map((meal) => meal.nutrients));
  return { index, meals, totals, deviation: targets.kcal > 0 ? (totals.kcal - targets.kcal) / targets.kcal : 0 };
}

export function generateMealPlan({ targets, exclusions, dietFocus, tolerance = DEFAULT_TOLERANCE, foods = foodCatalog }: MealPlanInput): MealPlanResult {
  const restrictions = resolveRestrictions(exclusions, dietFocus, foods);
  const options = mealSlots.flatMap((meal) => templates[meal].map((role) => ({ meal, role, list: candidates(foods, restrictions, meal, role) })));
  const blocked = options.filter((option) => !option.list.length).map(({ meal, role }) => ({ meal, role }));
  if (blocked.length) return { ok: false, blocked, restrictions };

  const days = Array.from({ length: 7 }, (_, index) => buildDay(index, mealSlots.map((meal) => {
    const chosen: CatalogFood[] = [];
    templates[meal].forEach((role, slot) => {
      const list = options.find((option) => option.meal === meal && option.role === role)!.list.filter((food) => !chosen.includes(food));
      // Rotación por día; la cena parte desde la mitad de la lista para no repetir la proteína del almuerzo.
      const offset = meal === 'dinner' ? Math.ceil(list.length / 2) : 0;
      const food = list[(index + offset + slot) % list.length];
      if (food) chosen.push(food);
    });
    const targetKcal = Math.round(targets.kcal * mealShares[meal]);
    const items = portion(chosen, targetKcal);
    return { meal, targetKcal, items, nutrients: addNutrients(items.map((entry) => entry.nutrients)) };
  }), targets));
  return { ok: true, plan: { ruleVersion: MEAL_PLAN_RULE_VERSION, catalogVersion: FOOD_CATALOG_VERSION, targets, tolerance, restrictions, days } };
}

// Intercambio (RF-13): mismo rol y comida, respetando restricciones, con porción de energía similar.
export function swapOptions(plan: MealPlan, day: number, meal: MealSlot, index: number, foods = foodCatalog) {
  const planned = plan.days[day]?.meals.find((entry) => entry.meal === meal);
  const current = planned?.items[index];
  if (!planned || !current) return [];
  const used = planned.items.map((entry) => entry.foodId);
  return foods.filter((food) => food.role === current.role && food.meals.includes(meal) && !used.includes(food.id) && isAllowed(food, plan.restrictions))
    .map((food) => {
      const swapped = item(food, food.per100g.kcal > 0 ? clampGrams(food, current.nutrients.kcal / food.per100g.kcal * 100) : food.servingGrams);
      const diff = { kcal: round1(swapped.nutrients.kcal - current.nutrients.kcal), protein: round1(swapped.nutrients.protein - current.nutrients.protein),
        carbs: round1(swapped.nutrients.carbs - current.nutrients.carbs), fat: round1(swapped.nutrients.fat - current.nutrients.fat) };
      return { item: swapped, diff };
    })
    .sort((a, b) => Math.abs(a.diff.kcal) + Math.abs(a.diff.protein) * 4 - (Math.abs(b.diff.kcal) + Math.abs(b.diff.protein) * 4))
    .slice(0, 6);
}

export function applySwap(plan: MealPlan, day: number, meal: MealSlot, index: number, replacement: PlanItem): MealPlan {
  const target = plan.days[day];
  if (!target) return plan;
  const meals = target.meals.map((entry) => {
    if (entry.meal !== meal || !entry.items[index]) return entry;
    const items = entry.items.map((current, position) => position === index ? replacement : current);
    return { ...entry, items, nutrients: addNutrients(items.map((value) => value.nutrients)) };
  });
  return { ...plan, days: plan.days.map((value) => value.index === day ? buildDay(day, meals, plan.targets) : value) };
}

export const withinTolerance = (plan: MealPlan, day: PlannedDay) => Math.abs(day.deviation) <= plan.tolerance;
