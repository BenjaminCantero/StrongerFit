import { techniqueFor } from '@strongerfit/training-engine';
import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { createEmptyProfile } from '../../profile/domain/profile';
import type { WorkoutRecord } from '../../progress/domain/progress';
import { createPlan, exerciseHistory, sessionFromDay } from './plan';
import { createSession, sessionRecord, sessionReducer } from './session';

describe('plan semanal en el perfil', () => {
  it('no planifica sin onboarding y usa los datos declarados', () => {
    expect(createPlan(createEmptyProfile(), new Date())).toBeNull();
    const plan = createPlan(createProfilePreview(), new Date('2026-10-30T12:00:00Z'))!;
    expect(plan.days).toHaveLength(4);
    expect(plan.input).toMatchObject({ environment: 'small-gym', equipment: ['bodyweight', 'dumbbells', 'barbell'], zones: [] });
    expect(plan.templateId).toBe('small-gym-intermediate-4d');
  });

  it('convierte un día en una sesión válida con sus series y descansos', () => {
    const day = createProfilePreview().trainingPlan!.days[0]!;
    const template = sessionFromDay(day);
    expect(template.exercises.map((item) => item.sets.length)).toEqual(day.exercises.map((item) => item.sets));
    expect(() => createSession(template, 0)).not.toThrow();
  });

  it('incluye las indicaciones de técnica provisionales de cada ejercicio', () => {
    const day = createProfilePreview().trainingPlan!.days[0]!;
    const template = sessionFromDay(day);
    expect(template.exercises.map((item) => item.technique)).toEqual(day.exercises.map((item) => techniqueFor(item.exerciseId)));
    expect(template.exercises.every((item) => item.technique.length >= 3)).toBe(true);
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

  it('sin registros la primera serie es de calibración y el historial queda vacío (RF-32)', () => {
    const exercise = sessionFromDay(day, [], '2026-10-30').exercises[0]!;
    expect(exercise.measure).toBe('weighted-reps');
    expect(exercise.sets.every((set) => set.weightKg === 0)).toBe(true);
    expect(exercise.sets.map((set) => !!set.calibration)).toEqual([true, ...Array(first.sets - 1).fill(false)]);
    expect(exerciseHistory([record('c', '2026-11-02', [{ weightKg: 50, reps: 5 }])], first.exerciseId, '2026-10-30')).toEqual([]);
  });

  it('la sobrecarga aceptada tiene prioridad sobre el historial (BR-22)', () => {
    const workouts = [record('b', '2026-10-27', [{ weightKg: 40, reps: 10 }])];
    const exercise = sessionFromDay(day, workouts, '2026-10-30', { [first.exerciseId]: 42.5 }).exercises[0]!;
    expect(exercise.sets.every((set) => set.weightKg === 42.5 && !set.calibration)).toBe(true);
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
