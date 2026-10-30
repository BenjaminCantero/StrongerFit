import { isDateKey, shiftDate } from '../../../shared/calendar';

export type Period = '4w' | '3m' | '1y';
export type WorkoutRecord = {
  id: string; date: string; time: string; name: string; durationMinutes: number;
  volumeKg: number; status: 'completed' | 'missed';
};
export type WeightRecord = { date: string; kg: number };
export type ProgressData = { workouts: WorkoutRecord[]; weights: WeightRecord[] };
export type VolumePoint = { from: string; through: string; label: string; kg: number; current: boolean };
export type ProgressState = ProgressData & { period: Period };
export type ProgressAction = { type: 'select-period'; period: Period } | { type: 'record-weight'; date: string; value: string };

export function monthStart(date: string, offset = 0): string {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1 + offset, 1, 12)).toISOString().slice(0, 10);
}

export function periodStart(period: Period, today: string): string {
  return period === '4w' ? shiftDate(today, -27) : monthStart(today, period === '3m' ? -2 : -11);
}

export function progressSummary(data: ProgressData, period: Period, today: string) {
  const from = periodStart(period, today);
  const planned = data.workouts.filter((record) => record.date >= from && record.date <= today);
  const completed = planned.filter((record) => record.status === 'completed');
  const points: VolumePoint[] = Array.from({ length: period === '4w' ? 4 : period === '3m' ? 3 : 12 }, (_, index) => {
    const start = period === '4w' ? shiftDate(from, index * 7) : monthStart(from, index);
    const end = period === '4w' ? shiftDate(start, 6) : shiftDate(monthStart(start, 1), -1);
    const through = end > today ? today : end;
    const label = period === '4w' ? `Sem ${index + 1}` : new Intl.DateTimeFormat('es-CL', { month: 'short', timeZone: 'UTC' }).format(new Date(`${start}T12:00:00Z`)).replace('.', '');
    return { from: start, through, label, current: today >= start && today <= end,
      kg: completed.filter((record) => record.date >= start && record.date <= through).reduce((sum, record) => sum + record.volumeKg, 0) };
  });
  const first = points[0]!.kg;
  const latestWeight = data.weights.filter((record) => record.date >= from && record.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  return {
    from, through: today, completed: completed.length, planned: planned.length,
    adherence: planned.length ? Math.round(completed.length / planned.length * 100) : null,
    points, totalKg: completed.reduce((sum, record) => sum + record.volumeKg, 0),
    changePercent: first > 0 ? (points.at(-1)!.kg - first) / first * 100 : null,
    history: [...completed].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 4),
    latestWeight,
  };
}

export function parseWeight(value: string): number | null {
  if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const kg = Number(value.trim().replace(',', '.'));
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  if (action.type === 'select-period') return { ...state, period: action.period };
  const kg = parseWeight(action.value);
  if (kg === null || !isDateKey(action.date)) return state;
  return { ...state, weights: [...state.weights.filter((record) => record.date !== action.date), { date: action.date, kg }] };
}

export const createEmptyProgress = (): ProgressData => ({ workouts: [], weights: [] });
