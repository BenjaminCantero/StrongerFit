import { describe, expect, it } from 'vitest';
import { available, exerciseById, generatePlan, profiles, swapOptions, validateExercise, type PlanInput } from './index';

const base: PlanInput = { days: 3, minutes: 45, equipment: ['dumbbells'], athleteProfile: 'general', level: 'intermediate', injury: false };
const ids = (plan: ReturnType<typeof generatePlan>) => plan.days.flatMap((day) => day.exercises.map((item) => item.exerciseId));

describe('generador de rutina', () => {
  it('respeta la frecuencia y solo usa equipo disponible (CA-02, BR-03)', () => {
    for (const days of [2, 3, 4, 5]) {
      const plan = generatePlan({ ...base, days });
      expect(plan.days).toHaveLength(days);
      for (const id of ids(plan)) expect(exerciseById(id)!.equipment.some((item) => item === 'dumbbells' || item === 'bodyweight')).toBe(true);
    }
    expect(ids(generatePlan({ ...base, equipment: [] })).every((id) => exerciseById(id)!.equipment.includes('bodyweight'))).toBe(true);
  });

  it('aplica series, repeticiones, descansos y días del perfil (CA-23)', () => {
    const strength = generatePlan({ ...base, days: 6, minutes: 60, equipment: ['barbell', 'dumbbells', 'machines'], athleteProfile: 'strength-hypertrophy' });
    expect(strength.days).toHaveLength(6);
    for (const item of strength.days.flatMap((day) => day.exercises)) {
      const kind = exerciseById(item.exerciseId)!.kind;
      expect(item.sets).toBeGreaterThanOrEqual(3);
      expect(item.sets).toBeLessThanOrEqual(4);
      expect([item.repsMin, item.repsMax]).toEqual(profiles['strength-hypertrophy'].reps[kind]);
    }
    expect(generatePlan({ ...base, days: 6 }).days).toHaveLength(5);
    const items = strength.days.flatMap((day) => day.exercises);
    expect(items.filter((item) => exerciseById(item.exerciseId)!.kind !== 'isometric').every((item) => item.tempo?.join('-') === '3-1-1')).toBe(true);
    expect(generatePlan(base).days.flatMap((day) => day.exercises).some((item) => item.tempo)).toBe(false);
  });

  it('es determinista, guarda versión y avisa por lesión (CA-16, BR-04)', () => {
    expect(generatePlan(base)).toEqual(generatePlan(base));
    expect(generatePlan(base)).toMatchObject({ ruleVersion: 'entrenamiento-0.1', catalogVersion: 'catalogo-inicial-0.1' });
    expect(generatePlan({ ...base, injury: true }).warnings).toContain('injury-review');
    expect(generatePlan({ ...base, minutes: 30 }).days.every((day) => day.exercises.length <= 3)).toBe(true);
  });

  it('valida ediciones y ofrece cambios del mismo patrón con equipo propio (CA-12)', () => {
    const item = generatePlan(base).days[0]!.exercises[0]!;
    expect(validateExercise(item, base.equipment)).toBeNull();
    expect(validateExercise({ ...item, sets: 0 }, base.equipment)).toMatch(/series/);
    expect(validateExercise({ ...item, repsMin: 12, repsMax: 8 }, base.equipment)).toMatch(/repeticiones/);
    expect(validateExercise({ ...item, exerciseId: 'back-squat' }, base.equipment)).toMatch(/equipamiento/);
    const pattern = exerciseById(item.exerciseId)!.pattern;
    expect(swapOptions(item, base.equipment).every((exercise) => exercise.pattern === pattern && available(base.equipment).includes(exercise))).toBe(true);
  });
});
