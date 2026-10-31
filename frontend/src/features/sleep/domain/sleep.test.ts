import { describe, expect, it } from 'vitest';
import { createEmptySleep, cycles, formatSleep, manualRange, sleepMinutes, sleepReducer, sleepWeek, validateSleep } from './sleep';

describe('sueño', () => {
  it('CA-22: de 23:30 a 07:00 son 7 h 30 min y 5 ciclos de 90 min', () => {
    const { bed, wake } = manualRange('2026-10-30', '23:30', '07:00');
    expect({ bed, wake }).toEqual({ bed: '2026-10-30T23:30', wake: '2026-10-31T07:00' });
    expect(sleepMinutes(bed, wake)).toBe(450);
    expect(formatSleep(450)).toBe('7 h 30 min');
    expect(cycles(450, 90)).toEqual({ complete: 5, remainder: 0 });
    expect(cycles(450, 100)).toEqual({ complete: 4, remainder: 50 });
  });

  it('registra con botones y pide corrección si despertar es antes de dormir', () => {
    let state = sleepReducer(createEmptySleep(), { type: 'go-to-bed', at: '2026-10-30T23:10' });
    expect(sleepReducer(state, { type: 'wake-up', at: '2026-10-30T22:00' })).toBe(state);
    state = sleepReducer(state, { type: 'wake-up', at: '2026-10-31T06:40' });
    expect(state.pendingBed).toBeNull();
    expect(state.records).toEqual([{ id: '2026-10-30T23:10_2026-10-31T06:40', bed: '2026-10-30T23:10', wake: '2026-10-31T06:40' }]);
  });

  it('rechaza registros inválidos, demasiado largos o superpuestos', () => {
    const records = [{ id: 'a', bed: '2026-10-30T23:00', wake: '2026-10-31T07:00' }];
    expect(validateSleep('2026-10-30T23:00', '2026-10-30T22:00')).toBe('wake-before-bed');
    expect(validateSleep('2026-10-30T20:00', '2026-10-31T13:00')).toBe('too-long');
    expect(validateSleep('2026-10-30T23:00', '2026-10-30T23:00')).toBe('too-short');
    expect(validateSleep('2026-10-31T06:00', '2026-10-31T08:00', records)).toBe('overlap');
    expect(validateSleep('2026-10-31T15:00', '2026-10-31T15:40', records)).toBeNull();
    expect(validateSleep('2026-02-30T23:00', '2026-03-01T07:00')).toBe('invalid');
  });

  it('acepta ciclos entre 70 y 120 minutos', () => {
    const state = createEmptySleep();
    expect(sleepReducer(state, { type: 'set-cycle', minutes: 100 }).cycleMinutes).toBe(100);
    expect(sleepReducer(state, { type: 'set-cycle', minutes: 60 })).toBe(state);
    expect(sleepReducer(state, { type: 'set-cycle', minutes: 125 })).toBe(state);
  });

  it('resume las últimas 7 noches por fecha de despertar, sumando siestas', () => {
    const records = [
      { id: 'a', bed: '2026-10-29T23:00', wake: '2026-10-30T07:00' },
      { id: 'b', bed: '2026-10-30T15:00', wake: '2026-10-30T15:30' },
      { id: 'c', bed: '2026-10-30T23:30', wake: '2026-10-31T06:30' },
    ];
    const week = sleepWeek(records, '2026-10-31');
    expect(week.nights.map((night) => night.minutes)).toEqual([null, null, null, null, null, 510, 420]);
    expect(week).toMatchObject({ averageMinutes: 465, logged: 2 });
  });
});
