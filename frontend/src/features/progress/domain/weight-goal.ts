import { shiftDate } from '../../../shared/calendar';
import type { WeightGoal } from '../../onboarding/domain/onboarding';
import type { WeightRecord } from './progress';

const DAY = 86_400_000;
export const MIN_WEIGHINS = 3;
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY);

// Línea ideal lineal entre inicio y meta (SRS 8.9).
export function idealAt(goal: WeightGoal, date: string): number {
  const total = days(goal.startDate, goal.endDate);
  const ratio = total > 0 ? Math.max(0, Math.min(1, days(goal.startDate, date) / total)) : 1;
  return goal.startKg + (goal.targetKg - goal.startKg) * ratio;
}

// Promedio móvil de 7 días en cada pesaje; sin tendencia con menos de 3 pesajes.
export function movingAverage(weights: WeightRecord[]): WeightRecord[] {
  if (weights.length < MIN_WEIGHINS) return [];
  return weights.map((record) => {
    const window = weights.filter((item) => item.date <= record.date && item.date >= shiftDate(record.date, -6));
    return { date: record.date, kg: window.reduce((sum, item) => sum + item.kg, 0) / window.length };
  });
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

export function weightGoalSummary(goal: WeightGoal, records: WeightRecord[], today: string) {
  const weights = records.filter((record) => record.date >= goal.startDate && record.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const currentKg = weights.at(-1)?.kg ?? goal.startKg;
  const span = goal.targetKg - goal.startKg;
  const changeKg = round1(currentKg - goal.startKg);
  const trend = movingAverage(weights);
  const idealToday = idealAt(goal, today);
  return {
    weights, trend, currentKg, changeKg, idealToday: round1(idealToday),
    progressPercent: span === 0 ? 100 : Math.round(changeKg / span * 100) || 0,
    // Solo con datos suficientes se compara la tendencia con la línea ideal (CU-12).
    comparison: trend.length ? round1(trend.at(-1)!.kg - idealToday) * Math.sign(span || 1) : null,
    weeksLeft: Math.max(0, Math.ceil(days(today, goal.endDate) / 7)),
    totalDays: days(goal.startDate, goal.endDate),
  };
}
