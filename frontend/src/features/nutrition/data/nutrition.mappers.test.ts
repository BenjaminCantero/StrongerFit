import { buildDay, foodCatalog, nutritionTargets, type MealPlan } from '@strongerfit/nutrition-engine';
import type { Database } from '@strongerfit/contracts/database';
import { describe, expect, it } from 'vitest';
import type { FoodEntry } from '../domain/food-entry';
import { proposeMealPlanForTest } from './nutrition.fixtures';
import { diaryFromRows, foodLogRows, foodSource, mealPlanFromRows, mealPlanPayload, nutritionPlanFromRow, swapChanges, targetsRow,
  weightsFromRows } from './nutrition.mappers';

type Tables = Database['public']['Tables'];
const catalogFood = foodCatalog[0]!;

describe('procedencia (BR-07)', () => {
  it('distingue catálogo, código de barras, foto y propios', () => {
    expect(foodSource(catalogFood.id)).toEqual({ source: catalogFood.provenance.source, source_version: catalogFood.provenance.version,
      license: catalogFood.provenance.license });
    expect(foodSource('off:7801234')).toEqual({ source: 'Open Food Facts', source_version: 'api-v2', license: 'ODbL-1.0' });
    expect(foodSource('photo:rice')).toMatchObject({ source: 'Estimación por foto', license: 'Propia' });
    expect(foodSource('desconocido')).toMatchObject({ source: 'StrongerFit', license: 'Propia' });
  });
});

const entry: FoodEntry = {
  id: 7, meal: 'lunch', nutrients: { kcal: 400, protein: 35, carbs: 40, fat: 10 },
  items: [
    { foodId: catalogFood.id, name: 'Principal', grams: 150, nutrients: { kcal: 300, protein: 30, carbs: 20, fat: 8 } },
    { foodId: 'off:7801234', name: 'Acompañamiento', grams: 50.5, nutrients: { kcal: 100, protein: 5, carbs: 20, fat: 2 } },
  ],
};

describe('diario', () => {
  it('un registro se guarda como una fila por alimento, en orden', () => {
    const rows = foodLogRows(entry, '2026-11-26', 'e1');
    expect(rows.map((row) => [row.position, row.food_id, row.grams, row.kcal])).toEqual([[0, catalogFood.id, 150, 300], [1, 'off:7801234', 50.5, 100]]);
    expect(rows[0]).toMatchObject({ entry_id: 'e1', logged_on: '2026-11-26', meal: 'lunch', food_name: 'Principal', protein_g: 30 });
  });

  it('las filas reconstruyen los registros con id local estable', () => {
    const rows = [...foodLogRows(entry, '2026-11-26', 'e1').reverse(), ...foodLogRows({ ...entry, meal: 'dinner' }, '2026-11-26', 'e2')]
      .map((row, index): Tables['food_logs']['Row'] => ({ ...row, id: `r${index}`, user_id: 'u', created_at: `2026-11-26T1${index}:00:00Z`, updated_at: '' }));
    const ids = new Map([['e1', 1], ['e2', 2]]);
    const diary = diaryFromRows(rows, (id) => ids.get(id)!);
    expect(diary).toHaveLength(2);
    expect(diary[0]).toEqual({ ...entry, id: 1, date: '2026-11-26', entryId: 'e1' });
    expect(diary[1]).toMatchObject({ id: 2, meal: 'dinner', entryId: 'e2' });
  });
});

const person = { sex: 'female' as const, ageYears: 30, heightCm: 165, weightKg: 70, activity: 'moderate' as const };
const settings = { direction: 'deficit' as const, adjustment: 0.15, proteinPerKg: 1.6, fatShare: 0.25 };

describe('metas nutricionales', () => {
  it('guardar y leer devuelve la misma meta', () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const row = targetsRow(person, settings, result);
    expect(row).toMatchObject({ direction: 'deficit', adjustment: 0.15, target_kcal: result.kcal, bmr_kcal: result.bmr, rule_version: result.ruleVersion });
    const plan = nutritionPlanFromRow({ ...row, id: 't1', user_id: 'u', created_at: '2026-11-26T12:00:00Z', training_day_kcal: null, rest_day_kcal: null });
    expect(plan).toEqual({ id: 't1', proteinPerKg: 1.6, fatShare: 0.25, result, savedAt: '2026-11-26T12:00:00Z' });
  });
});

describe('minuta', () => {
  const plan = proposeMealPlanForTest({ kcal: 2100, protein: 120, carbs: 230, fat: 70 });

  function rowsFrom(payload: ReturnType<typeof mealPlanPayload>) {
    const planRow: Tables['meal_plans']['Row'] = {
      id: 'm1', user_id: 'u', status: 'active', created_at: '2026-11-26T12:00:00Z', rule_version: payload.rule_version,
      catalog_version: payload.catalog_version, nutrition_target_id: payload.nutrition_target_id, week_start: payload.week_start,
      meals_per_day: payload.meals_per_day, params: payload.params as never,
    };
    const meals = payload.meals.map((meal, index): Tables['planned_meals']['Row'] => ({
      ...meal, id: `p${index}`, plan_id: 'm1', user_id: 'u', updated_at: '', items: meal.items as never,
    })).reverse();
    return { planRow, meals };
  }

  it('el payload y las filas reconstruyen la misma minuta', () => {
    const { planRow, meals } = rowsFrom(mealPlanPayload(plan, 't1', '2026-11-23'));
    const stored = mealPlanFromRows(planRow, meals);
    expect(stored).toMatchObject({ id: 'm1', createdAt: '2026-11-26T12:00:00Z' });
    const { id: _id, createdAt: _createdAt, ...rest } = stored;
    expect(rest).toEqual(plan);
  });

  it('un intercambio cambia solo los items de esa comida', () => {
    const day = plan.days[0]!;
    const meal = day.meals[0]!;
    const replaced = { ...meal.items[0]!, foodId: 'otro', name: 'Otro' };
    const items = [replaced, ...meal.items.slice(1)];
    const after: MealPlan = { ...plan, days: plan.days.map((current) => current.index !== 0 ? current
      : buildDay(0, current.type, current.meals.map((entry) => entry.meal === meal.meal ? { ...entry, items } : entry), current.targets)) };
    expect(swapChanges(plan, after)).toEqual([{ day: 0, slot: meal.meal, items }]);
  });
});

describe('pesajes', () => {
  it('omite mediciones sin peso', () => {
    expect(weightsFromRows([{ measured_on: '2026-11-25', weight_kg: 70.4 }, { measured_on: '2026-11-26', weight_kg: null }]))
      .toEqual([{ date: '2026-11-25', kg: 70.4 }]);
  });
});
