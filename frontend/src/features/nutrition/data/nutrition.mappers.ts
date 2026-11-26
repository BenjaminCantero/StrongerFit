import type { Database } from '@strongerfit/contracts/database';
import { addNutrients, buildDay, foodCatalog, FOOD_CATALOG_VERSION, nutritionTargets, type ActivityLevel, type Direction, type MealPlan,
  type NutritionTargets, type Person, type PlanItem, type PlanSlot, type Sex, type Warning } from '@strongerfit/nutrition-engine';
import type { NutritionPlan, SavedMealPlan } from '../../profile/domain/profile';
import type { WeightRecord } from '../../progress/domain/progress';
import type { DiaryEntry } from '../domain/diary';
import { sumNutrients, type FoodEntry, type MealId } from '../domain/food-entry';
import type { GoalSettings } from '../domain/goals';

type Tables = Database['public']['Tables'];
type FoodLogRow = Tables['food_logs']['Row'];
type TargetsRow = Tables['nutrition_targets']['Row'];
type MealPlanRow = Tables['meal_plans']['Row'];
type PlannedMealRow = Tables['planned_meals']['Row'];

const catalog = new Map(foodCatalog.map((food) => [food.id, food]));

// Procedencia de cada alimento registrado (BR-07): catálogo, Open Food Facts, foto o propio.
export function foodSource(foodId: string) {
  const food = catalog.get(foodId);
  if (food) return { source: food.provenance.source, source_version: food.provenance.version, license: food.provenance.license };
  if (foodId.startsWith('off:')) return { source: 'Open Food Facts', source_version: 'api-v2', license: 'ODbL-1.0' };
  if (foodId.startsWith('photo:')) return { source: 'Estimación por foto', source_version: 'demo-0.1', license: 'Propia' };
  return { source: 'StrongerFit', source_version: '1', license: 'Propia' };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function foodLogRows(entry: FoodEntry, date: string, entryId: string) {
  return entry.items.map((item, position) => ({
    entry_id: entryId, logged_on: date, meal: entry.meal, position, food_id: item.foodId, food_name: item.name.slice(0, 120),
    grams: round1(item.grams), kcal: round1(item.nutrients.kcal), protein_g: round1(item.nutrients.protein),
    carbs_g: round1(item.nutrients.carbs), fat_g: round1(item.nutrients.fat), catalog_version: FOOD_CATALOG_VERSION,
    ...foodSource(item.foodId),
  }));
}

export function diaryFromRows(rows: FoodLogRow[], idFor: (entryId: string) => number): DiaryEntry[] {
  const groups = new Map<string, FoodLogRow[]>();
  const sorted = [...rows].sort((a, b) => a.logged_on.localeCompare(b.logged_on) || a.created_at.localeCompare(b.created_at) || a.position - b.position);
  for (const row of sorted) groups.set(row.entry_id, [...(groups.get(row.entry_id) ?? []), row]);
  return [...groups.entries()].map(([entryId, group]) => {
    const items = [...group].sort((a, b) => a.position - b.position).map((row) => ({
      foodId: row.food_id, name: row.food_name, grams: Number(row.grams),
      nutrients: { kcal: Number(row.kcal), protein: Number(row.protein_g), carbs: Number(row.carbs_g), fat: Number(row.fat_g) },
    }));
    return { id: idFor(entryId), entryId, date: group[0]!.logged_on, meal: group[0]!.meal as MealId, items,
      nutrients: sumNutrients(items.map((item) => item.nutrients)) };
  });
}

export const targetsRow = (person: Person, settings: GoalSettings, result: NutritionTargets) => ({
  sex: person.sex, age_years: person.ageYears, height_cm: person.heightCm, weight_kg: person.weightKg, activity: person.activity,
  direction: result.direction, adjustment: result.adjustment, protein_per_kg: settings.proteinPerKg, fat_share: settings.fatShare,
  bmr_kcal: result.bmr, tdee_kcal: result.tdee, target_kcal: result.kcal, protein_g: result.protein, carbs_g: result.carbs, fat_g: result.fat,
  warnings: result.warnings, formula: 'mifflin-st-jeor', rule_version: result.ruleVersion,
});

// La meta se recalcula desde sus entradas guardadas (RNF-07): el cálculo es determinista. La
// dirección guardada ya trae aplicado el riesgo (BR-19), por eso aquí va healthRisk: false.
export function nutritionPlanFromRow(row: TargetsRow): NutritionPlan {
  const proteinPerKg = Number(row.protein_per_kg);
  const fatShare = Number(row.fat_share);
  const result = nutritionTargets({
    sex: row.sex as Sex, ageYears: row.age_years, heightCm: Number(row.height_cm), weightKg: Number(row.weight_kg),
    activity: row.activity as ActivityLevel, direction: row.direction as Direction, adjustment: Number(row.adjustment),
    proteinPerKg, fatShare, healthRisk: false,
  });
  return { id: row.id, proteinPerKg, fatShare, savedAt: row.created_at,
    result: { ...result, ruleVersion: row.rule_version, warnings: row.warnings as Warning[] } };
}

// params guarda todo lo que no son comidas, con las metas exactas por comida; las columnas
// target_kcal y target_protein_g llevan valores redondeados para consultas.
export function mealPlanPayload(plan: MealPlan, nutritionTargetId: string, weekStart: string) {
  const { days, ruleVersion, catalogVersion, ...rest } = plan;
  return {
    rule_version: ruleVersion, catalog_version: catalogVersion, nutrition_target_id: nutritionTargetId, week_start: weekStart,
    meals_per_day: days[0]?.meals.length ?? 0,
    params: { ...rest, days: days.map((day) => ({ index: day.index, type: day.type, targets: day.targets,
      meals: day.meals.map((meal) => ({ meal: meal.meal, targetKcal: meal.targetKcal, targetProtein: meal.targetProtein })) })) },
    meals: days.flatMap((day) => day.meals.map((meal) => ({
      day: day.index, slot: meal.meal, day_type: day.type, target_kcal: Math.round(meal.targetKcal),
      target_protein_g: Math.round(meal.targetProtein), items: meal.items,
    }))),
  };
}

type PlanParams = Omit<MealPlan, 'days' | 'ruleVersion' | 'catalogVersion'> & {
  days: { index: number; type: MealPlan['days'][number]['type']; targets: MealPlan['days'][number]['targets'];
    meals: { meal: PlanSlot; targetKcal: number; targetProtein: number }[] }[];
};

export function mealPlanFromRows(plan: MealPlanRow, meals: PlannedMealRow[]): SavedMealPlan {
  const { days, ...rest } = plan.params as unknown as PlanParams;
  return {
    id: plan.id, createdAt: plan.created_at, ruleVersion: plan.rule_version, catalogVersion: plan.catalog_version, ...rest,
    days: days.map((day) => buildDay(day.index, day.type, day.meals.map((slot) => {
      const row = meals.find((meal) => meal.day === day.index && meal.slot === slot.meal);
      const items = (row?.items ?? []) as unknown as PlanItem[];
      // Mismo redondeo que el motor, para que la minuta leída sea idéntica a la guardada.
      return { ...slot, items, nutrients: addNutrients(items.map((item) => item.nutrients)) };
    }), day.targets)),
  };
}

export function swapChanges(before: MealPlan, after: MealPlan) {
  return after.days.flatMap((day) => day.meals.flatMap((meal) => {
    const previous = before.days.find((value) => value.index === day.index)?.meals.find((value) => value.meal === meal.meal);
    return previous && JSON.stringify(previous.items) !== JSON.stringify(meal.items) ? [{ day: day.index, slot: meal.meal, items: meal.items }] : [];
  }));
}

export const weightsFromRows = (rows: { measured_on: string; weight_kg: number | null }[]): WeightRecord[] =>
  rows.flatMap((row) => row.weight_kg === null ? [] : [{ date: row.measured_on, kg: Number(row.weight_kg) }]);
