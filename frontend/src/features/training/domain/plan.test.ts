import { describe, expect, it } from 'vitest';
import { createProfilePreview } from '../../profile/data/profile.preview';
import { createEmptyProfile, profileReducer } from '../../profile/domain/profile';
import { createPlan, sessionFromDay } from './plan';
import { createSession } from './session';

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
