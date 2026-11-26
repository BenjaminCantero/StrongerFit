import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { foodCatalog, nutritionTargets } from '@strongerfit/nutrition-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInUser } from '../../../../test/integration/users';
import { onboardingPayload } from '../../account/data/account.mappers';
import { completeOnboarding, createDraft, type Draft } from '../../onboarding/domain/onboarding';
import type { FoodEntry } from '../domain/food-entry';

let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const { saveOnboarding } = await import('../../account/data/account.repository');
const repo = await import('./nutrition.repository');

const draft = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: '', noHealthFlags: true, healthFlags: [], zones: [], disclaimerRead: true, consent: true,
});

async function onboard(client: SupabaseClient<Database>) {
  current = client;
  const result = completeOnboarding(draft(), new Date(), '2026-11-24');
  if (!result.ok) throw new Error('borrador inválido');
  await saveOnboarding(onboardingPayload(result, '2026-11-24'));
}

const food = foodCatalog[0]!;
const entry = (grams: number): FoodEntry => ({
  id: 0, meal: 'lunch', nutrients: { kcal: grams, protein: 10, carbs: 10, fat: 1 },
  items: [{ foodId: food.id, name: food.name, grams, nutrients: { kcal: grams, protein: 10, carbs: 10, fat: 1 } },
    { foodId: 'off:7801234', name: 'Pan', grams: 30, nutrients: { kcal: 80, protein: 3, carbs: 15, fat: 1 } }],
});
let next = 1;
const ids = new Map<string, number>();
const idFor = (entryId: string) => ids.get(entryId) ?? (ids.set(entryId, next++), ids.get(entryId)!);
const person = { sex: 'female' as const, ageYears: 30, heightCm: 165, weightKg: 80, activity: 'moderate' as const };
const settings = { direction: 'maintenance' as const, adjustment: 0, proteinPerKg: 1.6, fatShare: 0.25 };

describe('repositorio de nutrición contra Supabase local', () => {
  beforeEach(async () => { await onboard((await signedInUser()).client); });

  it('agrega, edita y borra registros del diario conservando el orden (RF-11)', async () => {
    await repo.writeDiary({ kind: 'add', date: '2026-11-26', entry: entry(150) });
    const [saved] = await repo.fetchFoodLogs('2026-11-26', idFor);
    expect(saved!.items.map((item) => item.foodId)).toEqual([food.id, 'off:7801234']);

    await repo.writeDiary({ kind: 'update', before: saved!, entry: entry(200) });
    const updated = await repo.fetchFoodLogs('2026-11-26', idFor);
    expect(updated).toHaveLength(1);
    expect(updated[0]!.items[0]!.grams).toBe(200);

    await repo.writeDiary({ kind: 'delete-meal', date: '2026-11-26', meal: 'lunch' });
    expect(await repo.fetchFoodLogs('2026-11-26', idFor)).toEqual([]);
  });

  it('guarda la meta y la lee igual (RNF-07)', async () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const id = await repo.saveNutritionTargets(person, settings, result);
    expect(await repo.fetchNutritionPlan()).toMatchObject({ id, proteinPerKg: 1.6, result: { kcal: result.kcal } });
  });

  it('guarda la minuta, aplica un intercambio y la lee', async () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const targetId = await repo.saveNutritionTargets(person, settings, result);
    const { proposeMealPlanForTest } = await import('./nutrition.fixtures');
    const plan = proposeMealPlanForTest(result);
    const planId = await repo.saveMealPlan(plan, targetId, '2026-11-23');
    const stored = (await repo.fetchMealPlan())!;
    expect(stored.id).toBe(planId);
    const meal = stored.days[0]!.meals[0]!;
    const items = [{ ...meal.items[0]!, name: 'Cambiado' }, ...meal.items.slice(1)];
    await repo.swapMeals(planId, [{ day: 0, slot: meal.meal, items }]);
    expect((await repo.fetchMealPlan())!.days[0]!.meals[0]!.items[0]!.name).toBe('Cambiado');
  });

  it('un pesaje por día; repetirlo lo reemplaza (RF-15)', async () => {
    await repo.recordWeight('2026-11-26', 79.6);
    await repo.recordWeight('2026-11-26', 79.4);
    expect(await repo.fetchWeights()).toEqual(expect.arrayContaining([{ date: '2026-11-26', kg: 79.4 }]));
    expect((await repo.fetchWeights()).filter((item) => item.date === '2026-11-26')).toHaveLength(1);
  });

  it('otra persona no ve el diario ni la meta de la primera (CA-01)', async () => {
    await repo.writeDiary({ kind: 'add', date: '2026-11-26', entry: entry(150) });
    await onboard((await signedInUser()).client);
    expect(await repo.fetchFoodLogs('2026-11-26', idFor)).toEqual([]);
    expect(await repo.fetchNutritionPlan()).toBeNull();
  });
});
