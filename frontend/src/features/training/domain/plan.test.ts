import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { createEmptyProfile, profileReducer } from '../../profile/domain/profile';
import type { WorkoutRecord } from '../../progress/domain/progress';
import { createPlan, exerciseHistory, sessionFromDay } from './plan';
import { createSession, sessionRecord, sessionReducer } from './session';

describe('plan semanal en el perfil', () => {
  it('no planifica sin onboarding y usa los datos declarados', () => {
    expect(createPlan(createEmptyProfile(), new Date())).toBeNull();
    const plan = createPlan(createProfilePreview(), new Date('2026-10-30T12:00:00Z'))!;
    expect(plan.days).toHaveLength(4);
    expect(plan.input).toMatchObject({ athleteProfile: 'strength-hypertrophy', equipment: ['dumbbells', 'barbell'] });
  });

  it('convierte un día en una sesión válida con sus series y descansos', () => {
    const day = createProfilePreview().trainingPlan!.days[0]!;
    const template = sessionFromDay(day);
    expect(template.exercises.map((item) => item.sets.length)).toEqual(day.exercises.map((item) => item.sets));
    expect(() => createSession(template, 0)).not.toThrow();
    expect(template.exercises.filter((item) => !item.timer).every((item) => item.tempo?.join('-') === '3-1-1')).toBe(true);
  });

  it('edita un ejercicio del plan sin tocar los demás', () => {
    const profile = createProfilePreview();
    const exercise = { ...profile.trainingPlan!.days[1]!.exercises[0]!, sets: 2 };
    const next = profileReducer(profile, { type: 'update-plan-exercise', day: 1, index: 0, exercise });
    expect(next.trainingPlan!.days[1]!.exercises[0]!.sets).toBe(2);
    expect(next.trainingPlan!.days[0]).toBe(profile.trainingPlan!.days[0]);
    expect(profileReducer(profile, { type: 'update-plan-exercise', day: 9, index: 0, exercise })).toBe(profile);
  });
});

describe('carga de la vez anterior', () => {
  const day = createProfilePreview().trainingPlan!.days[0]!;
  const first = day.exercises[0]!;
  const record = (id: string, date: string, sets: { weightKg: number; reps: number }[]): WorkoutRecord => ({
    id, date, time: '18:00', name: day.name, durationMinutes: 50, volumeKg: 0, status: 'completed',
    exercises: [{ exerciseId: first.exerciseId, sets }],
  });

  it('precarga cada serie con la misma serie de la última sesión y la última carga para series extra', () => {
    const workouts = [record('a', '2026-10-20', [{ weightKg: 30, reps: 10 }]),
      record('b', '2026-10-27', [{ weightKg: 40, reps: 10 }, { weightKg: 42.5, reps: 8 }])];
    const exercise = sessionFromDay(day, workouts, '2026-10-30').exercises[0]!;
    expect(exercise.exerciseId).toBe(first.exerciseId);
    expect(exercise.sets.map((set) => set.weightKg)).toEqual([40, 42.5, ...Array(first.sets - 2).fill(42.5)]);
    expect(exercise.sets.every((set) => set.reps === first.repsMax && !set.completed)).toBe(true);
    expect(exercise.history).toEqual([{ label: 'Hace 3 días', weightKg: 42.5, reps: 8, sets: 2 },
      { label: 'Hace 10 días', weightKg: 30, reps: 10, sets: 1 }]);
  });

  it('sin registros parte en 0 kg y el historial queda vacío', () => {
    const exercise = sessionFromDay(day, [], '2026-10-30').exercises[0]!;
    expect(exercise.sets.every((set) => set.weightKg === 0)).toBe(true);
    expect(exerciseHistory([record('c', '2026-11-02', [{ weightKg: 50, reps: 5 }])], first.exerciseId, '2026-10-30')).toEqual([]);
  });

  it('el registro de la sesión guarda solo las series completadas por ejercicio', () => {
    const template = sessionFromDay(day, [], '2026-10-30');
    let state = createSession(template, 0);
    const exercise = state.exercises[0]!;
    state = sessionReducer(state, { type: 'complete-set', exerciseId: exercise.id, setId: 1, weightKg: 35, reps: 9, now: 1000 });
    state = sessionReducer(state, { type: 'finish', now: 60_000 });
    expect(sessionRecord(state, { id: 's', date: '2026-10-30', time: '18:00' })!.exercises)
      .toEqual([{ exerciseId: first.exerciseId, sets: [{ weightKg: 35, reps: 9 }] }]);
  });
});
