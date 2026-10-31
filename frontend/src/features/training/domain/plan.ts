import { exerciseById, generatePlan, type Plan, type PlanDay } from '@strongerfit/training-engine';
import type { ProfileData } from '../../profile/domain/profile';
import type { SessionTemplate } from './session';

// Entrada del generador desde el onboarding (BR-02: sin estos datos no se planifica).
export function planInput(profile: ProfileData) {
  const record = profile.onboarding;
  if (!record || profile.daysPerWeek === null || profile.sessionMinutes === null) return null;
  return { days: profile.daysPerWeek, minutes: profile.sessionMinutes, equipment: record.equipment, athleteProfile: record.athleteProfile,
    level: record.level, injury: record.healthFlags.includes('injury') };
}

export function createPlan(profile: ProfileData, now: Date): (Plan & { createdAt: string }) | null {
  const input = planInput(profile);
  return input ? { ...generatePlan(input), createdAt: now.toISOString() } : null;
}

export const estimatedMinutes = (day: PlanDay) =>
  Math.round(day.exercises.reduce((total, item) => total + item.sets * (45 + item.restSeconds), 0) / 60);

// La sesión parte con las series del plan vacías: el registro lo completa la persona.
export function sessionFromDay(day: PlanDay): SessionTemplate {
  return {
    title: day.name, elapsedSeconds: 0, initialRestSeconds: 0,
    exercises: day.exercises.map((item, index) => {
      const exercise = exerciseById(item.exerciseId)!;
      return {
        id: `${item.exerciseId}-${index}`, name: exercise.name, muscleGroup: exercise.muscleGroup, restSeconds: item.restSeconds,
        technique: [], history: [],
        sets: Array.from({ length: item.sets }, (_, set) => ({ id: set + 1, weightKg: 0, reps: item.repsMax, completed: false })),
      };
    }),
  };
}
