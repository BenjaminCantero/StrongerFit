import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { generatePlan } from '@strongerfit/training-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInUser } from '../../../../test/integration/users';
import { onboardingPayload } from '../../account/data/account.mappers';
import { completeOnboarding, createDraft, type Draft } from '../../onboarding/domain/onboarding';
import { newClientId } from '../../../lib/data/ids';
import type { SessionState } from '../domain/session';
import { sessionPayload } from './training.mappers';

let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const { saveOnboarding } = await import('../../account/data/account.repository');
const repo = await import('./training.repository');

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

const plan = generatePlan({ days: 3, minutes: 45, environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'], level: 'beginner', zones: [] });

function finishedState(exerciseId: string): SessionState {
  return {
    title: 'Día A', exerciseIndex: 0, status: 'finished', elapsedMs: 20 * 60_000, runningSinceMs: null,
    rest: { endsAtMs: null, pausedRemainingMs: 0, durationMs: 0 },
    exercises: [{ id: 'a', exerciseId, name: 'x', muscleGroup: 'x', restSeconds: 60, measure: 'weighted-reps', technique: [], history: [],
      sets: [{ id: 1, weightKg: 20, reps: 10, completed: true }, { id: 2, weightKg: 20, reps: 9, completed: true }] }],
  };
}

describe('repositorio de entrenamiento contra Supabase local', () => {
  let a: Awaited<ReturnType<typeof signedInUser>>;

  beforeEach(async () => {
    a = await signedInUser();
    await onboard(a.client);
  });

  it('guarda y lee el plan activo; uno nuevo archiva el anterior', async () => {
    expect(await repo.fetchActivePlan()).toBeNull();
    const first = await repo.saveWorkoutPlan(plan);
    const stored = await repo.fetchActivePlan();
    expect(stored).toMatchObject({ id: first, days: plan.days, templateId: plan.templateId });
    expect(stored?.dayIds).toHaveLength(plan.days.length);

    const second = await repo.saveWorkoutPlan(plan);
    expect((await repo.fetchActivePlan())?.id).toBe(second);
    const { data } = await a.client.from('workout_plans').select('status').order('created_at');
    expect(data).toEqual([{ status: 'archived' }, { status: 'active' }]);
  });

  it('edita un ejercicio del plan (RF-06)', async () => {
    await repo.saveWorkoutPlan(plan);
    const stored = (await repo.fetchActivePlan())!;
    const exercise = { ...stored.days[0]!.exercises[0]!, sets: 5, note: 'Más lento' };
    await repo.updatePlanExercise(stored.dayIds[0]!, 0, exercise);
    expect((await repo.fetchActivePlan())!.days[0]!.exercises[0]).toEqual(exercise);
  });

  it('enviar dos veces la misma sesión no la duplica (CA-03)', async () => {
    const exerciseId = plan.days[0]!.exercises[0]!.exerciseId;
    const payload = sessionPayload(finishedState(exerciseId), { clientId: newClientId(), planId: null, dayId: null, finishedAt: new Date() });
    const id = await repo.submitSession(payload);
    expect(await repo.submitSession(payload)).toBe(id);
    const history = await repo.fetchTrainingHistory();
    expect(history.workouts).toHaveLength(1);
    expect(history.workouts[0]).toMatchObject({ id: payload.client_id, volumeKg: 20 * 10 + 20 * 9,
      exercises: [{ exerciseId, sets: [{ weightKg: 20, reps: 10 }, { weightKg: 20, reps: 9 }] }] });
  });

  it('una carga aceptada queda pendiente hasta la próxima sesión (BR-22)', async () => {
    const exerciseId = plan.days[0]!.exercises[0]!.exerciseId;
    await repo.submitSession(sessionPayload(finishedState(exerciseId), { clientId: newClientId(), planId: null, dayId: null, finishedAt: new Date(Date.now() - 60_000) }));
    await repo.recordLoadDecision({ exerciseId, suggestedKg: 22.5, appliedKg: 22.5, decision: 'applied' }, 'cargas-0.1');
    expect((await repo.fetchTrainingHistory()).nextLoads).toEqual({ [exerciseId]: 22.5 });

    await repo.submitSession(sessionPayload(finishedState(exerciseId), { clientId: newClientId(), planId: null, dayId: null, finishedAt: new Date(Date.now() + 60_000) }));
    expect((await repo.fetchTrainingHistory()).nextLoads).toEqual({});
    const { data } = await a.client.from('recommendation_runs').select('kind').eq('kind', 'load-suggestion');
    expect(data).toHaveLength(1);
  });

  it('recuerda el intervalo de un ejercicio (RF-25)', async () => {
    await repo.saveTimerPreset('burpee', 60, { kind: 'interval', workSeconds: 30, restSeconds: 15, rounds: 6 });
    await repo.saveTimerPreset('burpee', 60, { kind: 'interval', workSeconds: 40, restSeconds: 20, rounds: 5 });
    expect(await repo.fetchTimerPresets()).toEqual({ burpee: { kind: 'interval', workSeconds: 40, restSeconds: 20, rounds: 5 } });
  });

  it('otra persona no ve el entrenamiento de la primera (CA-01)', async () => {
    await repo.saveWorkoutPlan(plan);
    const b = await signedInUser();
    await onboard(b.client);
    expect(await repo.fetchActivePlan()).toBeNull();
    expect((await repo.fetchTrainingHistory()).workouts).toEqual([]);
  });
});
