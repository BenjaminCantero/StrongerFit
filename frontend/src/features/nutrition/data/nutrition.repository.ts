import type { Json } from '@strongerfit/contracts/database';
import type { MealPlan, NutritionTargets, Person } from '@strongerfit/nutrition-engine';
import { db } from '../../../lib/data/client';
import { DataError, unwrap } from '../../../lib/data/errors';
import { newClientId } from '../../../lib/data/ids';
import type { NutritionPlan, SavedMealPlan } from '../../profile/domain/profile';
import type { WeightRecord } from '../../progress/domain/progress';
import type { DiaryEntry } from '../domain/diary';
import type { FoodEntry, MealId } from '../domain/food-entry';
import type { GoalSettings } from '../domain/goals';
import { diaryFromRows, foodLogRows, mealPlanFromRows, mealPlanPayload, nutritionPlanFromRow, targetsRow, weightsFromRows,
  type swapChanges } from './nutrition.mappers';

function requireId(id: string | null | undefined): string {
  if (!id) throw new DataError('unknown');
  return id;
}

export async function fetchFoodLogs(date: string, idFor: (entryId: string) => number): Promise<DiaryEntry[]> {
  const rows = unwrap(await db().from('food_logs').select('*').eq('logged_on', date).order('created_at')) ?? [];
  return diaryFromRows(rows, idFor);
}

export type DiaryWrite =
  | { kind: 'add'; date: string; entry: FoodEntry }
  | { kind: 'update'; before: DiaryEntry; entry: FoodEntry }
  | { kind: 'delete-meal'; date: string; meal: MealId };

// Editar inserta primero el registro nuevo y después borra el anterior: si el borrado falla
// queda un duplicado visible, nunca se pierde el registro.
export async function writeDiary(write: DiaryWrite): Promise<void> {
  if (write.kind === 'delete-meal') {
    unwrap(await db().from('food_logs').delete().eq('logged_on', write.date).eq('meal', write.meal));
    return;
  }
  const date = write.kind === 'add' ? write.date : write.before.date;
  unwrap(await db().from('food_logs').insert(foodLogRows(write.entry, date, newClientId())));
  if (write.kind === 'update' && write.before.entryId) {
    unwrap(await db().from('food_logs').delete().eq('entry_id', write.before.entryId));
  }
}

export async function fetchNutritionPlan(): Promise<NutritionPlan | null> {
  const row = unwrap(await db().from('nutrition_targets').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle());
  return row ? nutritionPlanFromRow(row) : null;
}

export async function saveNutritionTargets(person: Person, settings: GoalSettings, result: NutritionTargets): Promise<string> {
  const row = unwrap(await db().from('nutrition_targets').insert(targetsRow(person, settings, result)).select('id').single());
  const id = requireId(row?.id);
  unwrap(await db().from('recommendation_runs').insert({ kind: 'nutrition-targets', rule_version: result.ruleVersion, result_id: id,
    params: { direction: result.direction, adjustment: result.adjustment, protein_per_kg: settings.proteinPerKg, fat_share: settings.fatShare } }));
  return id;
}

export async function fetchMealPlan(): Promise<SavedMealPlan | null> {
  const plan = unwrap(await db().from('meal_plans').select('*').eq('status', 'active').maybeSingle());
  if (!plan) return null;
  const meals = unwrap(await db().from('planned_meals').select('*').eq('plan_id', plan.id)) ?? [];
  return mealPlanFromRows(plan, meals);
}

export async function saveMealPlan(plan: MealPlan, nutritionTargetId: string, weekStart: string): Promise<string> {
  return requireId(unwrap(await db().rpc('save_meal_plan', { payload: mealPlanPayload(plan, nutritionTargetId, weekStart) as unknown as Json })));
}

export async function swapMeals(planId: string, changes: ReturnType<typeof swapChanges>): Promise<void> {
  for (const change of changes) {
    unwrap(await db().from('planned_meals').update({ items: change.items as unknown as NonNullable<Json> })
      .eq('plan_id', planId).eq('day', change.day).eq('slot', change.slot));
  }
}

export async function fetchWeights(): Promise<WeightRecord[]> {
  const rows = unwrap(await db().from('body_measurements').select('measured_on, weight_kg').order('measured_on')) ?? [];
  return weightsFromRows(rows);
}

export async function recordWeight(date: string, kg: number): Promise<void> {
  unwrap(await db().from('body_measurements').upsert({ measured_on: date, weight_kg: kg }, { onConflict: 'user_id,measured_on' }));
}
