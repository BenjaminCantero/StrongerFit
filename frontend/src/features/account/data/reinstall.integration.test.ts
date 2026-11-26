import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { foodCatalog, nutritionTargets, swapOptions, applySwap } from '@strongerfit/nutrition-engine';
import { generatePlan } from '@strongerfit/training-engine';
import { describe, expect, it, vi } from 'vitest';
import { signedInUser, signIn } from '../../../../test/integration/users';
import { newClientId } from '../../../lib/data/ids';
import { completeOnboarding, createDraft, type Draft } from '../../onboarding/domain/onboarding';
import { proposeMealPlanForTest } from '../../nutrition/data/nutrition.fixtures';
import { swapChanges } from '../../nutrition/data/nutrition.mappers';
import type { FoodEntry } from '../../nutrition/domain/food-entry';
import type { SessionState } from '../../training/domain/session';
import { sessionPayload } from '../../training/data/training.mappers';
import { onboardingPayload } from './account.mappers';

let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const account = await import('./account.repository');
const identity = await import('../../profile/data/identity.repository');
const training = await import('../../training/data/training.repository');
const nutrition = await import('../../nutrition/data/nutrition.repository');

const today = '2026-11-26';
const draft = (name: string): Draft => ({
  ...createDraft(), name, age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: '', noHealthFlags: true, healthFlags: [], zones: [], disclaimerRead: true, consent: true,
});

async function onboard(client: SupabaseClient<Database>, name: string) {
  current = client;
  const result = completeOnboarding(draft(name), new Date(), '2026-11-24');
  if (!result.ok) throw new Error('borrador inválido');
  await account.saveOnboarding(onboardingPayload(result, '2026-11-24'));
}

const plan = generatePlan({ days: 3, minutes: 45, environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'], level: 'beginner', zones: [] });
const exerciseId = plan.days[0]!.exercises[0]!.exerciseId;

const finished = (): SessionState => ({
  title: 'Día A', exerciseIndex: 0, status: 'finished', elapsedMs: 20 * 60_000, runningSinceMs: null,
  rest: { endsAtMs: null, pausedRemainingMs: 0, durationMs: 0 },
  exercises: [{ id: 'a', exerciseId, name: 'x', muscleGroup: 'x', restSeconds: 60, measure: 'weighted-reps', technique: [], history: [],
    sets: [{ id: 1, weightKg: 20, reps: 10, completed: true }, { id: 2, weightKg: 20, reps: 9, completed: true }] }],
});

const food = foodCatalog[0]!;
const entry: FoodEntry = {
  id: 0, meal: 'lunch', nutrients: { kcal: 150, protein: 10, carbs: 10, fat: 1 },
  items: [{ foodId: food.id, name: food.name, grams: 150, nutrients: { kcal: 150, protein: 10, carbs: 10, fat: 1 } }],
};

// Los IDs locales del diario los asigna la app; se usa el mismo generador en ambas lecturas
// para que no cuenten como diferencia (es la única normalización de este archivo).
let next = 1;
const ids = new Map<string, number>();
const idFor = (entryId: string) => ids.get(entryId) ?? (ids.set(entryId, next++), ids.get(entryId)!);

// Todo lo que la app lee al iniciar sesión.
async function readAll(client: SupabaseClient<Database>) {
  current = client;
  return {
    account: await account.fetchAccountStatus(),
    identity: await identity.fetchIdentity(),
    plan: await training.fetchActivePlan(),
    history: await training.fetchTrainingHistory(),
    timers: await training.fetchTimerPresets(),
    nutritionPlan: await nutrition.fetchNutritionPlan(),
    mealPlan: await nutrition.fetchMealPlan(),
    logs: await nutrition.fetchFoodLogs(today, idFor),
    weights: await nutrition.fetchWeights(),
  };
}

describe('datos que sobreviven a reinstalar (H-2, SRS 11.3)', () => {
  it('un cliente nuevo con las mismas credenciales lee exactamente lo mismo', async () => {
    const a = await signedInUser();
    await onboard(a.client, 'Ana');

    // Rutina generada y un ejercicio editado.
    await training.saveWorkoutPlan(plan);
    const stored = (await training.fetchActivePlan())!;
    await training.updatePlanExercise(stored.dayIds[0]!, 0, { ...stored.days[0]!.exercises[0]!, sets: 5, note: 'Más lento' });

    // Sesión terminada, temporizador y decisión de sobrecarga.
    await training.submitSession(sessionPayload(finished(), { clientId: newClientId(), planId: null, dayId: null, finishedAt: new Date() }));
    await training.saveTimerPreset('burpee', 60, { kind: 'interval', workSeconds: 30, restSeconds: 15, rounds: 6 });
    await training.recordLoadDecision({ exerciseId, suggestedKg: 22.5, appliedKg: 22.5, decision: 'applied' }, 'cargas-0.1');

    // Meta, minuta con un intercambio, diario y pesajes.
    const person = { sex: 'female' as const, ageYears: 30, heightCm: 165, weightKg: 80, activity: 'moderate' as const };
    const settings = { direction: 'maintenance' as const, adjustment: 0, proteinPerKg: 1.6, fatShare: 0.25 };
    const targets = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const targetId = await nutrition.saveNutritionTargets(person, settings, targets);
    const meals = proposeMealPlanForTest(targets);
    const mealPlanId = await nutrition.saveMealPlan(meals, targetId, '2026-11-23');
    const slot = meals.days[0]!.meals[0]!.meal;
    const option = swapOptions(meals, 0, slot, 0)[0]!;
    const swapped = applySwap(meals, 0, slot, 0, option.item);
    await nutrition.swapMeals(mealPlanId, swapChanges(meals, swapped));
    await nutrition.writeDiary({ kind: 'add', date: today, entry });
    await nutrition.recordWeight('2026-11-25', 79.6);
    await nutrition.recordWeight(today, 79.2);

    const before = await readAll(a.client);
    const after = await readAll(await signIn(a.email, a.password));

    expect(after.account).toEqual(before.account);
    expect(after.identity).toEqual(before.identity);
    expect(after.plan).toEqual(before.plan);
    expect(after.history).toEqual(before.history);
    expect(after.timers).toEqual(before.timers);
    expect(after.nutritionPlan).toEqual(before.nutritionPlan);
    expect(after.mealPlan).toEqual(before.mealPlan);
    expect(after.logs).toEqual(before.logs);
    expect(after.weights).toEqual(before.weights);

    // Contenido mínimo: la igualdad sola no prueba que haya datos.
    expect(after.account).toBe('ready'); // onboarding y consentimiento completos
    expect(after.plan!.days[0]!.exercises[0]).toMatchObject({ sets: 5, note: 'Más lento' });
    expect(after.history.workouts).toHaveLength(1);
    expect(after.history.nextLoads).toEqual({ [exerciseId]: 22.5 });
    expect(after.timers).toEqual({ burpee: { kind: 'interval', workSeconds: 30, restSeconds: 15, rounds: 6 } });
    expect(after.mealPlan!.days[0]!.meals[0]!.items[0]!.foodId).toBe(option.item.foodId);
    expect(after.logs).toHaveLength(1);
    expect(after.logs[0]!.items[0]!.foodId).toBe(food.id);
    // El onboarding ya registra el peso inicial: 1 de onboarding + 2 pesajes.
    expect(after.weights).toEqual([{ date: '2026-11-24', kg: 80 }, { date: '2026-11-25', kg: 79.6 }, { date: today, kg: 79.2 }]);
  });

  it('otra persona no ve nada de la primera (CA-01)', async () => {
    const a = await signedInUser();
    await onboard(a.client, 'Ana');
    await training.saveWorkoutPlan(plan);
    await nutrition.writeDiary({ kind: 'add', date: today, entry });
    await nutrition.recordWeight(today, 79.2);

    const c = await signedInUser();
    await onboard(c.client, 'Carla');
    const read = await readAll(c.client);
    expect(read.identity.name).toBe('Carla');
    expect(read.plan).toBeNull();
    expect(read.history.workouts).toEqual([]);
    expect(read.timers).toEqual({});
    expect(read.nutritionPlan).toBeNull();
    expect(read.mealPlan).toBeNull();
    expect(read.logs).toEqual([]);
    // Solo su propio peso inicial del onboarding, no los pesajes de Ana.
    expect(read.weights).toEqual([{ date: '2026-11-24', kg: 80 }]);
  });
});
