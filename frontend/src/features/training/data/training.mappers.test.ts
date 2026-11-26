import { describe, expect, it } from 'vitest';
import { generatePlan } from '@strongerfit/training-engine';
import type { Database } from '@strongerfit/contracts/database';
import type { SessionState } from '../domain/session';
import { loadDecisionRow, nextLoadsFromRows, planFromRows, planPayload, sessionPayload, timerPresetRow, timerSpecFromRow,
  workoutsFromRows, type SessionWithSets } from './training.mappers';

type Tables = Database['public']['Tables'];
const plan = generatePlan({ days: 3, minutes: 45, environment: 'small-gym', equipment: ['bodyweight', 'dumbbells'], level: 'beginner', zones: ['knee'] });

// Simula lo que devuelve la base a partir del payload, para probar la ida y vuelta.
function rowsFrom(payload: ReturnType<typeof planPayload>) {
  const planRow: Tables['workout_plans']['Row'] = {
    id: 'plan-1', user_id: 'u', created_at: '2026-11-26T12:00:00Z', status: 'active',
    rule_version: payload.rule_version, template_id: payload.template_id, template_version: payload.template_version,
    catalog_version: payload.catalog_version, environment: payload.environment, level: payload.level,
    days_per_week: payload.days_per_week, session_minutes: payload.session_minutes, equipment: payload.equipment,
    zones: payload.zones, changes: payload.changes as never, warnings: payload.warnings,
  };
  // Días desordenados a propósito: el mapper ordena por position.
  const days = payload.days.map((day, index) => ({ id: `day-${index}`, plan_id: 'plan-1', user_id: 'u', position: day.position, weekday: day.weekday, name: day.name })).reverse();
  const exercises = payload.days.flatMap((day, index) => day.exercises.map((item) => ({
    ...item, id: `ex-${index}-${item.position}`, day_id: `day-${index}`, user_id: 'u', updated_at: '2026-11-26T12:00:00Z',
  })));
  return { planRow, days, exercises };
}

describe('plan de entrenamiento', () => {
  it('el payload y las filas reconstruyen el mismo plan', () => {
    const { planRow, days, exercises } = rowsFrom(planPayload(plan));
    const stored = planFromRows(planRow, days, exercises);
    expect(stored).toMatchObject({ id: 'plan-1', createdAt: '2026-11-26T12:00:00Z', dayIds: ['day-0', 'day-1', 'day-2'] });
    expect(stored.days).toEqual(plan.days);
    expect(stored.changes).toEqual(plan.changes);
    expect(stored.warnings).toEqual(plan.warnings);
    expect(stored.input).toEqual({ ...plan.input, environment: plan.environment });
  });
});

const finished = (overrides: Partial<SessionState> = {}): SessionState => ({
  title: 'Día A', exerciseIndex: 1, status: 'finished', elapsedMs: 30 * 60_000, runningSinceMs: null,
  rest: { endsAtMs: null, pausedRemainingMs: 0, durationMs: 0 },
  exercises: [
    { id: 'a', exerciseId: 'goblet-squat', name: 'Sentadilla', muscleGroup: 'Piernas', restSeconds: 90, measure: 'weighted-reps', technique: [], history: [],
      sets: [{ id: 1, weightKg: 20, reps: 10, completed: true, calibration: true, reserve: 2 }, { id: 2, weightKg: 22.5, reps: 8, completed: true, estimated: true },
        { id: 3, weightKg: 22.5, reps: 8, completed: false }] },
    { id: 'b', exerciseId: 'plank', name: 'Plancha', muscleGroup: 'Core', restSeconds: 60, measure: 'duration', technique: [], history: [],
      sets: [{ id: 1, weightKg: 0, reps: 40, completed: true }] },
    { id: 'c', name: 'Ejemplo sin catálogo', muscleGroup: '', restSeconds: 60, technique: [], history: [],
      sets: [{ id: 1, weightKg: 10, reps: 10, completed: true }] },
  ],
  ...overrides,
});

describe('envío de sesión', () => {
  it('solo envía series completadas de ejercicios del catálogo, con su posición', () => {
    const payload = sessionPayload(finished(), { clientId: 'c1', planId: 'p1', dayId: 'd1', finishedAt: new Date('2026-11-26T15:30:00Z') });
    expect(payload).toMatchObject({ client_id: 'c1', plan_id: 'p1', day_id: 'd1', title: 'Día A',
      started_at: '2026-11-26T15:00:00.000Z', finished_at: '2026-11-26T15:30:00.000Z' });
    expect(payload.sets).toEqual([
      { exercise_id: 'goblet-squat', exercise_position: 0, set_number: 1, weight_kg: 20, reps: 10, duration_seconds: null, completed: true, kind: 'calibration', reserve: 2, estimated: false },
      { exercise_id: 'goblet-squat', exercise_position: 0, set_number: 2, weight_kg: 22.5, reps: 8, duration_seconds: null, completed: true, kind: 'work', reserve: null, estimated: true },
      { exercise_id: 'plank', exercise_position: 1, set_number: 1, weight_kg: null, reps: null, duration_seconds: 40, completed: true, kind: 'work', reserve: null, estimated: false },
    ]);
  });
});

const session = (id: string, finishedAt: string, sets: Partial<Tables['performed_sets']['Row']>[]): SessionWithSets => ({
  id, user_id: 'u', client_id: `client-${id}`, plan_id: null, day_id: null, title: 'Día A',
  started_at: new Date(new Date(finishedAt).getTime() - 45 * 60_000).toISOString(), finished_at: finishedAt,
  created_at: finishedAt, updated_at: finishedAt,
  performed_sets: sets.map((set, index) => ({ id: `${id}-${index}`, session_id: id, user_id: 'u', exercise_id: 'goblet-squat', exercise_position: 0,
    set_number: index + 1, weight_kg: 20, reps: 10, duration_seconds: null, completed: true, kind: 'work', reserve: null, estimated: false,
    updated_at: finishedAt, ...set })),
});

describe('historial', () => {
  it('convierte sesiones en registros con volumen, duración y series por ejercicio', () => {
    const [record] = workoutsFromRows([session('s1', '2026-11-26T15:45:00Z', [
      { set_number: 2, weight_kg: 22.5, reps: 8 }, { set_number: 1 },
      { exercise_id: 'plank', exercise_position: 1, weight_kg: null, reps: null, duration_seconds: 40 },
    ])]);
    expect(record).toEqual({
      id: 'client-s1', date: '2026-11-26', time: '12:45', name: 'Día A', durationMinutes: 45, volumeKg: 20 * 10 + 22.5 * 8, status: 'completed',
      exercises: [
        { exerciseId: 'goblet-squat', sets: [{ weightKg: 20, reps: 10 }, { weightKg: 22.5, reps: 8 }] },
        { exerciseId: 'plank', sets: [{ weightKg: 0, reps: 40 }] },
      ],
    });
  });
});

const suggestion = (over: Partial<Tables['load_suggestions']['Row']>): Tables['load_suggestions']['Row'] => ({
  id: 'x', user_id: 'u', exercise_id: 'goblet-squat', session_id: null, kind: 'overload', suggested_kg: 25, applied_kg: 25,
  decision: 'applied', rule_version: 'cargas-0.1', created_at: '2026-11-26T16:00:00Z', decided_at: '2026-11-26T16:00:00Z', ...over,
});

describe('próximas cargas (BR-22)', () => {
  const sessions = [session('s1', '2026-11-26T15:45:00Z', [{}])];

  it('la última carga aceptada después de la última sesión del ejercicio queda pendiente', () => {
    expect(nextLoadsFromRows([suggestion({ applied_kg: 24, decision: 'modified' })], sessions)).toEqual({ 'goblet-squat': 24 });
  });

  it('una sesión posterior con el ejercicio la consume', () => {
    expect(nextLoadsFromRows([suggestion({ created_at: '2026-11-25T10:00:00Z' })], sessions)).toEqual({});
  });

  it('manda la decisión más reciente: deshacer o ignorar la anula', () => {
    expect(nextLoadsFromRows([
      suggestion({ id: 'b', decision: 'undone', applied_kg: null, created_at: '2026-11-26T16:05:00Z' }), suggestion({ id: 'a' }),
    ], sessions)).toEqual({});
  });
});

describe('decisiones de carga y temporizadores', () => {
  it('arma la fila de la decisión con su versión de reglas', () => {
    expect(loadDecisionRow({ exerciseId: 'goblet-squat', suggestedKg: 25, appliedKg: 24, decision: 'modified' }, 'cargas-0.1', new Date('2026-11-26T16:00:00Z')))
      .toEqual({ exercise_id: 'goblet-squat', kind: 'overload', suggested_kg: 25, applied_kg: 24, decision: 'modified', rule_version: 'cargas-0.1',
        decided_at: '2026-11-26T16:00:00.000Z' });
  });

  it('guarda y recupera un intervalo por ejercicio (RF-25)', () => {
    const row = timerPresetRow('burpee', 60, { kind: 'interval', workSeconds: 30, restSeconds: 15, rounds: 6 });
    expect(row).toEqual({ exercise_id: 'burpee', kind: 'interval', rest_seconds: 60, work_seconds: 30, interval_rest_seconds: 15, rounds: 6, hold_seconds: null });
    expect(timerSpecFromRow({ ...row, id: 'x', user_id: 'u', updated_at: '' })).toEqual({ kind: 'interval', workSeconds: 30, restSeconds: 15, rounds: 6 });
    expect(timerSpecFromRow({ ...row, kind: 'rest', id: 'x', user_id: 'u', updated_at: '' })).toBeNull();
  });
});
