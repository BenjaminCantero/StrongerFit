import { shiftDate, todayDateKey } from '../../../shared/calendar';
import { createEmptySleep, type SleepState } from '../domain/sleep';

// Fixture de diseño: noches de ejemplo de la última semana.
export function createSleepPreview(today = todayDateKey()): SleepState {
  const nights: [number, string, string][] = [[6, '23:40', '07:10'], [5, '00:20', '06:50'], [4, '23:15', '07:00'],
    [3, '23:50', '06:40'], [2, '22:55', '06:55'], [1, '23:30', '07:00']];
  return { ...createEmptySleep(), records: nights.map(([days, bed, wake]) => {
    const night = shiftDate(today, -days);
    const bedDate = bed < '12:00' ? shiftDate(night, 1) : night;
    const range = { bed: `${bedDate}T${bed}`, wake: `${shiftDate(night, 1)}T${wake}` };
    return { id: `${range.bed}_${range.wake}`, ...range };
  }) };
}
