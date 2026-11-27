import { describe, expect, it } from 'vitest';
import type { PlanInput } from '@strongerfit/training-engine';
import { createRoutinePreferences } from '../../onboarding/domain/onboarding';
import { suggestRoutines } from './suggestions';

const commercialInput: PlanInput = {
  days: 4,
  minutes: 60,
  environment: 'commercial-gym',
  equipment: ['bodyweight', 'dumbbells', 'barbell', 'bands', 'machines'],
  level: 'intermediate',
  zones: [],
};

describe('suggestRoutines', () => {
  it('genera sugerencias ordenadas por compatibilidad incluyendo plan personalizado y clásicos', () => {
    const prefs = {
      ...createRoutinePreferences(),
      preferredSplit: 'upper-lower' as const,
      trainingStyle: 'hypertrophy' as const,
      focusMuscles: ['legs-glutes' as const],
    };
    const results = suggestRoutines(commercialInput, 'muscle', prefs);
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results[0]!.matchScore).toBeGreaterThanOrEqual(results[1]!.matchScore);
    const personalized = results.find((item) => item.source === 'personalized');
    expect(personalized).toBeDefined();
    expect(personalized!.daysCount).toBe(4);
    expect(personalized!.matchReasons.some((reason) => reason.includes('Hipertrofia'))).toBe(true);
    expect(personalized!.matchReasons.some((reason) => reason.includes('piernas y glúteos'))).toBe(true);
  });

  it('aplica el estilo de fuerza pesada y el cardio final en los ejercicios generados', () => {
    const prefs = {
      ...createRoutinePreferences(),
      trainingStyle: 'strength-heavy' as const,
      cardioPreference: 'finisher' as const,
    };
    const results = suggestRoutines(commercialInput, 'strength', prefs);
    const personalized = results.find((item) => item.source === 'personalized')!;
    const firstDay = personalized.plan.days[0]!;
    expect(firstDay.exercises[0]!.repsMax).toBeLessThanOrEqual(8);
    expect(firstDay.exercises.at(-1)!.note).toContain('cardio');
  });

  it('funciona sin equipo comercial devolviendo al menos el plan personalizado adaptable', () => {
    const homeInput: PlanInput = {
      days: 3,
      minutes: 40,
      environment: 'none',
      equipment: ['bodyweight'],
      level: 'beginner',
      zones: ['knee'],
    };
    const results = suggestRoutines(homeInput, 'health', createRoutinePreferences());
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.source).toBe('personalized');
    expect(results[0]!.matchReasons.some((reason) => reason.includes('molestia'))).toBe(true);
  });
});
