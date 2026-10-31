import { currentTimeLabel, isDateKey, shiftDate, todayDateKey } from '../../../shared/calendar';

// Registro de sueño (RF-26, SRS 8.9). Las horas se guardan como hora local de Chile
// ('AAAA-MM-DDTHH:MM'); la duración es la diferencia entre ambas. Todo es estimación (BR-21).
export type SleepRecord = { id: string; bed: string; wake: string };
export type SleepState = { records: SleepRecord[]; pendingBed: string | null; cycleMinutes: number };
export type SleepAction =
  | { type: 'go-to-bed'; at: string }
  | { type: 'wake-up'; at: string }
  | { type: 'cancel-pending' }
  | { type: 'add'; bed: string; wake: string }
  | { type: 'delete'; id: string }
  | { type: 'set-cycle'; minutes: number }
  | { type: 'restore-pending'; at: string | null };

export const CYCLE = { default: 90, min: 70, max: 120 } as const;
export const MAX_SLEEP_MINUTES = 16 * 60;
const LOCAL = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;

export const localNow = (now = new Date()) => `${todayDateKey(now)}T${currentTimeLabel(now)}`;
const minutesOf = (local: string) => Date.parse(`${local}:00Z`) / 60_000;
export const isLocalTime = (value: string) => LOCAL.test(value) && isDateKey(value.slice(0, 10));
export const timeOf = (local: string) => local.slice(11);
export const wakeDate = (record: SleepRecord) => record.wake.slice(0, 10);

export function sleepMinutes(bed: string, wake: string) {
  return minutesOf(wake) - minutesOf(bed);
}

export function cycles(minutes: number, cycleMinutes: number) {
  return { complete: Math.floor(minutes / cycleMinutes), remainder: minutes % cycleMinutes };
}

export type SleepError = 'invalid' | 'wake-before-bed' | 'too-short' | 'too-long' | 'overlap';
export function validateSleep(bed: string, wake: string, records: SleepRecord[] = []): SleepError | null {
  if (!isLocalTime(bed) || !isLocalTime(wake)) return 'invalid';
  const minutes = sleepMinutes(bed, wake);
  if (minutes < 0) return 'wake-before-bed';
  if (minutes === 0) return 'too-short';
  if (minutes > MAX_SLEEP_MINUTES) return 'too-long';
  if (records.some((record) => record.bed < wake && bed < record.wake)) return 'overlap';
  return null;
}

// Ingreso manual: la noche indica la fecha de acostarse; si la hora de despertar es menor, es al día siguiente.
export function manualRange(night: string, bedTime: string, wakeTime: string) {
  const bed = `${night}T${bedTime}`;
  return { bed, wake: `${wakeTime <= bedTime ? shiftDate(night, 1) : night}T${wakeTime}` };
}

const add = (state: SleepState, bed: string, wake: string): SleepState => validateSleep(bed, wake, state.records) ? state
  : { ...state, records: [...state.records, { id: `${bed}_${wake}`, bed, wake }].sort((a, b) => a.bed.localeCompare(b.bed)) };

export function sleepReducer(state: SleepState, action: SleepAction): SleepState {
  switch (action.type) {
    case 'go-to-bed': return isLocalTime(action.at) ? { ...state, pendingBed: action.at } : state;
    case 'restore-pending': return action.at === null || isLocalTime(action.at) ? { ...state, pendingBed: action.at } : state;
    case 'cancel-pending': return { ...state, pendingBed: null };
    case 'wake-up': {
      if (!state.pendingBed) return state;
      const next = add(state, state.pendingBed, action.at);
      return next === state ? state : { ...next, pendingBed: null };
    }
    case 'add': return add(state, action.bed, action.wake);
    case 'delete': return { ...state, records: state.records.filter((record) => record.id !== action.id) };
    case 'set-cycle':
      return Number.isInteger(action.minutes) && action.minutes >= CYCLE.min && action.minutes <= CYCLE.max
        ? { ...state, cycleMinutes: action.minutes } : state;
  }
}

export type SleepNight = { date: string; minutes: number | null };

// Últimas 7 noches por fecha de despertar; varios registros el mismo día se suman (siestas incluidas).
export function sleepWeek(records: SleepRecord[], today: string) {
  const nights: SleepNight[] = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    const own = records.filter((record) => wakeDate(record) === date);
    return { date, minutes: own.length ? own.reduce((total, record) => total + sleepMinutes(record.bed, record.wake), 0) : null };
  });
  const logged = nights.filter((night) => night.minutes !== null);
  return { nights, averageMinutes: logged.length ? Math.round(logged.reduce((total, night) => total + night.minutes!, 0) / logged.length) : null, logged: logged.length };
}

export const latestSleep = (records: SleepRecord[]) => [...records].sort((a, b) => b.wake.localeCompare(a.wake))[0] ?? null;

export const formatSleep = (minutes: number) => `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;

export const createEmptySleep = (): SleepState => ({ records: [], pendingBed: null, cycleMinutes: CYCLE.default });
