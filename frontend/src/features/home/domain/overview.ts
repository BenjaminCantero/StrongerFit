import { exerciseById } from '@strongerfit/training-engine';
import { shiftDate, weekStart } from '../../../shared/calendar';
import type { Nutrients } from '../../nutrition/domain/food-entry';
import type { ProfileData } from '../../profile/domain/profile';
import type { ProgressData } from '../../progress/domain/progress';
import { weightGoalSummary } from '../../progress/domain/weight-goal';
import { estimatedMinutes } from '../../training/domain/plan';
import type { HomeOverview, WeekDay } from '../home.types';

const weekDays = [['Lunes', 'L'], ['Martes', 'M'], ['Miércoles', 'X'], ['Jueves', 'J'], ['Viernes', 'V'], ['Sábado', 'S'], ['Domingo', 'D']] as const;

type Input = { profile: ProfileData; progress: ProgressData; consumed: Nutrients; targets: Nutrients | null; today: string; now: Date };

// Resumen de Inicio a partir de datos guardados (RF-14). Sin datos, cada bloque queda en null.
export function homeOverview({ profile, progress, consumed, targets, today, now }: Input): HomeOverview {
  const completed = progress.workouts.filter((record) => record.status === 'completed' && record.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  return {
    firstName: profile.name.trim().split(/\s+/)[0] || null,
    date: now,
    activeWeeks: activeWeeks(completed.map((record) => record.date), today),
    workout: nextWorkout(profile, completed, today),
    nutrition: targets ? {
      consumedKcal: consumed.kcal, targetKcal: targets.kcal,
      macros: ([['protein', 'Proteínas'], ['carbs', 'Carbos'], ['fat', 'Grasas']] as const)
        .map(([kind, name]) => ({ kind, name, consumed: consumed[kind], target: targets[kind] })),
    } : null,
    adherence: weekAdherence(profile, completed, today),
    weight: weightProgress(profile, progress, today),
  };
}

// La rutina no fija días de la semana: se sugiere el día siguiente al último registrado.
function nextWorkout(profile: ProfileData, completed: ProgressData['workouts'], today: string): HomeOverview['workout'] {
  const plan = profile.trainingPlan;
  if (!plan?.days.length) return null;
  const last = completed.find((record) => plan.days.some((day) => day.name === record.name));
  const day = last ? (plan.days.findIndex((item) => item.name === last.name) + 1) % plan.days.length : 0;
  const planDay = plan.days[day]!;
  return {
    day, title: planDay.name, durationMinutes: estimatedMinutes(planDay),
    exercises: planDay.exercises.map((item) => exerciseById(item.exerciseId)?.name ?? item.exerciseId),
    doneToday: completed.some((record) => record.date === today),
  };
}

function weekAdherence(profile: ProfileData, completed: ProgressData['workouts'], today: string): HomeOverview['adherence'] {
  const target = profile.trainingPlan?.days.length ?? profile.daysPerWeek;
  if (!target && !completed.length) return null;
  const start = weekStart(today);
  const days: WeekDay[] = weekDays.map(([name, label], index) => {
    const date = shiftDate(start, index);
    const trained = completed.some((record) => record.date === date);
    return { name, label, state: trained ? 'completed' : date === today ? 'current' : date < today ? 'missed' : 'upcoming' };
  });
  const last = completed[0];
  return {
    completedSessions: new Set(completed.filter((record) => record.date >= start).map((record) => record.date)).size,
    targetSessions: target ?? 0, days,
    last: last ? { name: last.name, date: last.date, durationMinutes: last.durationMinutes, volumeKg: last.volumeKg } : null,
  };
}

// Semanas seguidas con al menos una sesión; la semana en curso cuenta solo si ya tiene una.
export function activeWeeks(dates: string[], today: string): number {
  const weeks = new Set(dates.map(weekStart));
  let week = weekStart(today);
  if (!weeks.has(week)) week = shiftDate(week, -7);
  let count = 0;
  while (weeks.has(week)) { count += 1; week = shiftDate(week, -7); }
  return count;
}

function weightProgress(profile: ProfileData, progress: ProgressData, today: string): HomeOverview['weight'] {
  const goal = profile.onboarding?.weightGoal;
  if (!goal) return null;
  const summary = weightGoalSummary(goal, progress.weights, today);
  return { startKg: goal.startKg, currentKg: summary.currentKg, targetKg: goal.targetKg, endDate: goal.endDate,
    progress: Math.max(0, Math.min(1, summary.progressPercent / 100)), weeksLeft: summary.weeksLeft };
}
