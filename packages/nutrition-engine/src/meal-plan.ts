import { foodCatalog, FOOD_CATALOG_VERSION, type CatalogFood, type FoodRole, type FoodTag, type MealSlot, type Nutrients } from './foods';

// Minuta semanal por combinación de alimentos (RF-12, SRS 10.2). Determinista: los mismos
// datos producen la misma minuta. Las recetas completas quedan para una versión posterior.
// Todos los valores numéricos de este archivo son referencia inicial provisional, sujeta a
// revisión profesional antes del lanzamiento público, igual que el motor de metas.
export const MEAL_PLAN_RULE_VERSION = 'minuta-0.2';
// Versiones anteriores que readMealPlan sabe abrir.
export const LEGACY_MEAL_PLAN_RULE_VERSIONS = ['minuta-0.1'] as const;
export const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
// Reparto de la energía diaria por comida (referencia inicial, BR-09).
export const mealShares: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };
// Reparto de la proteína: más pareja entre comidas principales y menor en la once.
export const proteinShares: Record<MealSlot, number> = { breakfast: 0.2, lunch: 0.35, snack: 0.1, dinner: 0.35 };
export const DEFAULT_TOLERANCE = 0.1;
// Tolerancia de proteína diaria frente a la meta (±10 %, igual que la energía).
export const PROTEIN_TOLERANCE = 0.1;
// Límites de porción frente a la porción habitual y redondeo en gramos.
export const portionLimits = { min: 0.5, max: 2.5, step: 5 } as const;

const templates: Record<MealSlot, FoodRole[]> = {
  breakfast: ['carb', 'dairy', 'fruit'],
  lunch: ['protein', 'carb', 'veg', 'fat'],
  snack: ['dairy', 'fruit'],
  dinner: ['protein', 'veg', 'carb', 'fat'],
};
// Si una dieta deja un rol sin opciones se intenta el siguiente; nunca se ignora una exclusión.
const fallbacks: Partial<Record<FoodRole, FoodRole[]>> = { dairy: ['protein', 'fat'] };
// Las comidas con más margen de porción se calculan al final y absorben lo que falte o sobre.
const portionOrder: MealSlot[] = ['breakfast', 'snack', 'lunch', 'dinner'];

export type Restrictions = { tags: FoodTag[]; names: string[]; unmatched: string[]; diet: 'vegan' | 'vegetarian' | null };
export type PlanItem = { foodId: string; name: string; role: FoodRole; grams: number; nutrients: Nutrients };
export type PlannedMeal = { meal: MealSlot; targetKcal: number; targetProtein: number; items: PlanItem[]; nutrients: Nutrients };
// deviation: energía frente a la meta del día; proteinDeviation: proteína frente a la meta del día.
export type PlannedDay = { index: number; targets: Nutrients; meals: PlannedMeal[]; totals: Nutrients; deviation: number; proteinDeviation: number };
export type MealPlan = {
  ruleVersion: string; catalogVersion: string; targets: Nutrients; tolerance: number; proteinTolerance: number;
  restrictions: Restrictions; days: PlannedDay[];
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
  food.verified === true && !food.tags.some((tag) => restrictions.tags.includes(tag)) && !restrictions.names.some((name) => normalize(food.name).includes(name));

const round1 = (value: number) => Math.round(value * 10) / 10;
const round5 = (grams: number) => Math.max(portionLimits.step, Math.round(grams / portionLimits.step) * portionLimits.step);
const limitGrams = (food: CatalogFood, grams: number) =>
  Math.min(food.servingGrams * portionLimits.max, Math.max(food.servingGrams * portionLimits.min, grams));
const clampGrams = (food: CatalogFood, grams: number) => round5(limitGrams(food, grams));

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

const isProteinRole = (role: FoodRole) => role === 'protein' || role === 'dairy';
const per = (food: CatalogFood, grams: number, key: keyof Nutrients) => food.per100g[key] * grams / 100;

// Porciones (BR-09). Las verduras quedan en su porción habitual. Los alimentos proteicos y
// lácteos se fijan para acercarse a la proteína de la comida, sin dejar a carbohidratos y
// grasas bajo su porción mínima; luego carbohidratos, grasas y frutas completan la energía.
// Ninguna porción sale de los límites: si no alcanza, la diferencia queda a la vista.
function portion(foods: CatalogFood[], targetKcal: number, targetProtein: number): PlanItem[] {
  const grams = new Map(foods.map((food) => [food, food.servingGrams]));
  const veg = foods.filter((food) => food.role === 'veg');
  const proteins = foods.filter((food) => isProteinRole(food.role));
  const energy = foods.filter((food) => food.role !== 'veg' && !isProteinRole(food.role));
  const sum = (list: CatalogFood[], key: keyof Nutrients, at = (food: CatalogFood) => grams.get(food)!) =>
    list.reduce((total, food) => total + per(food, at(food), key), 0);
  const vegKcal = sum(veg, 'kcal');
  const minEnergyKcal = sum(energy, 'kcal', (food) => food.servingGrams * portionLimits.min);
  const scale = (list: CatalogFood[], factor: number) => list.forEach((food) => grams.set(food, limitGrams(food, food.servingGrams * factor)));
  // Los carbohidratos también aportan proteína; tres pasadas bastan para estabilizar el reparto.
  for (let pass = 0; pass < 3; pass++) {
    const baseProtein = sum(proteins, 'protein', (food) => food.servingGrams);
    if (baseProtein > 0) {
      const needed = Math.max(0, targetProtein - sum([...veg, ...energy], 'protein'));
      const budget = Math.max(0, targetKcal - vegKcal - minEnergyKcal);
      const baseKcal = sum(proteins, 'kcal', (food) => food.servingGrams);
      // La energía tiene prioridad sobre la proteína: el factor no puede exceder el presupuesto.
      scale(proteins, Math.min(needed / baseProtein, baseKcal > 0 ? budget / baseKcal : Infinity));
    }
    const baseEnergy = sum(energy, 'kcal', (food) => food.servingGrams);
    if (baseEnergy > 0) scale(energy, Math.max(0, targetKcal - vegKcal - sum(proteins, 'kcal')) / baseEnergy);
  }
  // Si carbohidratos y grasas llegaron a su máximo y aún falta energía, los proteicos pueden
  // crecer hasta el borde superior de la tolerancia de proteína, nunca más allá.
  const missingKcal = targetKcal - vegKcal - sum(energy, 'kcal') - sum(proteins, 'kcal');
  const proteinKcal = sum(proteins, 'kcal');
  if (missingKcal > 0 && proteinKcal > 0) {
    const room = targetProtein * (1 + PROTEIN_TOLERANCE) - sum(foods, 'protein');
    const current = sum(proteins, 'protein');
    const growth = Math.min(missingKcal / proteinKcal, current > 0 ? Math.max(0, room) / current : 0);
    proteins.forEach((food) => grams.set(food, limitGrams(food, grams.get(food)! * (1 + growth))));
  }
  return foods.map((food) => item(food, food.role === 'veg' ? food.servingGrams : round5(grams.get(food)!)));
}

const ratio = (actual: number, target: number) => target > 0 ? (actual - target) / target : 0;

function buildDay(index: number, meals: PlannedMeal[], targets: Nutrients): PlannedDay {
  const totals = addNutrients(meals.map((meal) => meal.nutrients));
  return { index, targets, meals, totals, deviation: ratio(totals.kcal, targets.kcal), proteinDeviation: ratio(totals.protein, targets.protein) };
}

type Options = Map<MealSlot, Map<FoodRole, CatalogFood[]>>;

// Orden de rotación: cada día y cada casillero parte en un punto distinto de la lista. La cena
// parte desde la mitad para no repetir la proteína del almuerzo.
function rotation(list: CatalogFood[], day: number, meal: MealSlot, slot: number) {
  const start = day + slot + (meal === 'dinner' ? Math.ceil(list.length / 2) : 0);
  return (food: CatalogFood) => (list.indexOf(food) - start % list.length + list.length) % list.length;
}

// Clave lexicográfica: menor es mejor.
const compareKeys = (a: number[], b: number[]) => {
  for (let index = 0; index < a.length; index++) if (a[index] !== b[index]) return a[index]! - b[index]!;
  return 0;
};

type DayState = { usedToday: Set<string> };

// Elige los alimentos de una comida y fija sus porciones. Primero las verduras, luego los
// proteicos y al final carbohidratos, frutas y grasas. Cada casillero recorre su lista en
// orden de rotación y prefiere el primer alimento con el que la comida llega a su meta
// (proteína para los proteicos, energía para el resto); si ninguno llega, el que más se
// acerque. Nunca se consideran alimentos fuera de las restricciones.
const ADEQUACY_MARGIN = DEFAULT_TOLERANCE / 2;
const roleStage = (role: FoodRole) => role === 'veg' ? 0 : isProteinRole(role) ? 1 : 2;

function planMeal(meal: MealSlot, day: number, options: Options, state: DayState, targetKcal: number, targetProtein: number) {
  const roles = templates[meal];
  const chosen: (CatalogFood | undefined)[] = roles.map(() => undefined);
  const lists = roles.map((role) => options.get(meal)!.get(role)!);
  const order = roles.map((_, slot) => slot).sort((a, b) => roleStage(lists[a]![0]!.role) - roleStage(lists[b]![0]!.role) || a - b);
  const placeholder = (slot: number) => {
    const rank = rotation(lists[slot]!, day, meal, slot);
    return [...lists[slot]!].sort((a, b) => rank(a) - rank(b))[0]!;
  };
  for (const slot of order) {
    const list = lists[slot]!;
    const rank = rotation(list, day, meal, slot);
    const stage = roleStage(list[0]!.role);
    const shortfall = (food: CatalogFood) => {
      if (stage === 0) return 0;
      // Los casilleros aún sin elegir se ocupan con el primero de su rotación para reservar su energía.
      const trial = chosen.map((value, position) => position === slot ? food : value ?? placeholder(position));
      const reached = addNutrients(portion(trial, targetKcal, targetProtein).map((entry) => entry.nutrients));
      // Los que llegan empatan; entre los que no, se agrupan por tramos de lo que falta.
      return stage === 1 ? Math.ceil(Math.max(0, targetProtein * (1 - ADEQUACY_MARGIN) - reached.protein) / 5)
        : Math.ceil(Math.max(0, targetKcal * (1 - ADEQUACY_MARGIN) - reached.kcal) / 25);
    };
    chosen[slot] = list.filter((food) => !chosen.includes(food))
      .map((food) => ({ food, key: [state.usedToday.has(food.id) ? 1 : 0, shortfall(food), rank(food)] }))
      .sort((a, b) => compareKeys(a.key, b.key))[0]?.food;
  }
  const foods = chosen.filter((value): value is CatalogFood => !!value);
  foods.forEach((food) => state.usedToday.add(food.id));
  return portion(foods, targetKcal, targetProtein);
}

// Reparte la meta del día. Cada comida recibe su parte de lo que queda, de modo que lo que
// una comida no alcanza (por límites de porción) lo completan las siguientes.
function planDay(index: number, targets: Nutrients, options: Options): PlannedDay {
  const planned = new Map<MealSlot, PlannedMeal>();
  const state: DayState = { usedToday: new Set() };
  let kcalLeft = targets.kcal;
  let proteinLeft = targets.protein;
  portionOrder.forEach((meal, position) => {
    const rest = portionOrder.slice(position);
    const kcalShare = mealShares[meal] / rest.reduce((total, slot) => total + mealShares[slot], 0);
    const proteinShare = proteinShares[meal] / rest.reduce((total, slot) => total + proteinShares[slot], 0);
    const items = planMeal(meal, index, options, state, kcalLeft * kcalShare, proteinLeft * proteinShare);
    const nutrients = addNutrients(items.map((entry) => entry.nutrients));
    kcalLeft -= nutrients.kcal;
    proteinLeft -= nutrients.protein;
    planned.set(meal, { meal, targetKcal: Math.round(targets.kcal * mealShares[meal]), targetProtein: Math.round(targets.protein * proteinShares[meal]),
      items, nutrients });
  });
  return buildDay(index, mealSlots.map((meal) => planned.get(meal)!), targets);
}

export function generateMealPlan({ targets, exclusions, dietFocus, tolerance = DEFAULT_TOLERANCE, foods = foodCatalog }: MealPlanInput): MealPlanResult {
  const restrictions = resolveRestrictions(exclusions, dietFocus, foods);
  const options: Options = new Map(mealSlots.map((meal) => [meal, new Map(templates[meal].map((role) => [role, candidates(foods, restrictions, meal, role)]))]));
  const blocked = mealSlots.flatMap((meal) => templates[meal].filter((role) => !options.get(meal)!.get(role)!.length).map((role) => ({ meal, role })));
  if (blocked.length) return { ok: false, blocked, restrictions };
  const days = Array.from({ length: 7 }, (_, index) => planDay(index, targets, options));
  return { ok: true, plan: { ruleVersion: MEAL_PLAN_RULE_VERSION, catalogVersion: FOOD_CATALOG_VERSION, targets, tolerance,
    proteinTolerance: PROTEIN_TOLERANCE, restrictions, days } };
}

// Intercambio (RF-13): mismo rol y comida, respetando restricciones. Los alimentos proteicos
// conservan la proteína del original; el resto, la energía. Las porciones respetan los límites.
export function swapOptions(plan: MealPlan, day: number, meal: MealSlot, index: number, foods = foodCatalog) {
  const planned = plan.days[day]?.meals.find((entry) => entry.meal === meal);
  const current = planned?.items[index];
  if (!planned || !current) return [];
  const used = planned.items.map((entry) => entry.foodId);
  const key: keyof Nutrients = isProteinRole(current.role) && current.nutrients.protein > 0 ? 'protein' : 'kcal';
  return foods.filter((food) => food.role === current.role && food.meals.includes(meal) && !used.includes(food.id) && isAllowed(food, plan.restrictions))
    .map((food) => {
      const swapped = item(food, food.per100g[key] > 0 ? clampGrams(food, current.nutrients[key] / food.per100g[key] * 100) : food.servingGrams);
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
  return { ...plan, days: plan.days.map((value) => value.index === day ? buildDay(day, meals, target.targets) : value) };
}

export const withinTolerance = (plan: MealPlan, day: PlannedDay) => Math.abs(day.deviation) <= plan.tolerance;
export const proteinWithinTolerance = (plan: MealPlan, day: PlannedDay) => Math.abs(day.proteinDeviation) <= plan.proteinTolerance;
// Gramos de proteína que faltan para entrar en la tolerancia del día; 0 si no falta.
export const proteinShortfall = (day: PlannedDay) => Math.max(0, round1(day.targets.protein - day.totals.protein));

// Minutas guardadas con reglas anteriores (minuta-0.1): no tenían meta por día, proteína por
// comida ni desviación de proteína. Se completan sin recalcular porciones ni alimentos, para
// que se abran, se intercambien y se registren igual que antes. La versión de reglas se conserva.
type LegacyPlannedDay = Omit<PlannedDay, 'targets' | 'proteinDeviation'> & Partial<Pick<PlannedDay, 'targets' | 'proteinDeviation'>>;
type LegacyPlannedMeal = Omit<PlannedMeal, 'targetProtein'> & Partial<Pick<PlannedMeal, 'targetProtein'>>;
export type StoredMealPlan = Omit<MealPlan, 'days' | 'proteinTolerance'> & Partial<Pick<MealPlan, 'proteinTolerance'>> & {
  days: (Omit<LegacyPlannedDay, 'meals'> & { meals: LegacyPlannedMeal[] })[];
};

export function readMealPlan<Plan extends StoredMealPlan>(stored: Plan): Omit<Plan, keyof MealPlan> & MealPlan {
  const { targets } = stored;
  return {
    ...stored,
    proteinTolerance: stored.proteinTolerance ?? PROTEIN_TOLERANCE,
    days: stored.days.map((day) => {
      const dayTargets = day.targets ?? targets;
      const meals = day.meals.map((meal) => ({ ...meal, targetProtein: meal.targetProtein ?? Math.round(dayTargets.protein * (proteinShares[meal.meal] ?? 0)) }));
      return { ...buildDay(day.index, meals, dayTargets), totals: day.totals, deviation: day.deviation,
        proteinDeviation: day.proteinDeviation ?? ratio(day.totals.protein, dayTargets.protein) };
    }),
  };
}
