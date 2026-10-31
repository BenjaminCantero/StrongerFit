import { describe, expect, it } from 'vitest';
import { createProgressPreview } from '../data/progress.preview';
import { consistencyMap, createEmptyProgress, monthStart, parseWeight, periodStart, progressReducer, progressSummary, type ProgressState } from './progress';

const today = '2026-10-30';
const initial = (): ProgressState => ({ ...createProgressPreview(today), period: '4w' });

describe('resumen de progreso', () => {
  it('calcula adherencia y barras desde las mismas sesiones, contando solo las completadas', () => {
    const summary = progressSummary(initial(), '4w', today);
    expect(summary).toMatchObject({ completed: 14, planned: 16, adherence: 88, totalKg: 22120 });
    expect(summary.points.map((point) => point.kg)).toEqual([4800, 5200, 5100, 7020]);
    expect(summary.points.reduce((sum, point) => sum + point.kg, 0)).toBe(summary.totalKg);
    expect(summary.changePercent).toBeCloseTo(46.25);
    expect(summary.points.filter((point) => point.current)).toHaveLength(1);
  });

  it('filtra tres meses y doce meses sin reutilizar los totales de cuatro semanas', () => {
    const data = initial();
    const quarterly = progressSummary(data, '3m', today);
    const yearly = progressSummary(data, '1y', today);
    expect(quarterly).toMatchObject({ from: '2026-08-01', completed: 16, planned: 19, totalKg: 28020 });
    expect(quarterly.points).toHaveLength(3);
    expect(yearly).toMatchObject({ from: '2025-11-01', completed: 17, planned: 21, totalKg: 30620, changePercent: null });
    expect(yearly.points).toHaveLength(12);
    expect(yearly.points.reduce((sum, point) => sum + point.kg, 0)).toBe(yearly.totalKg);
    expect(data.workouts).toHaveLength(21);
  });

  it('ordena las cuatro sesiones recientes sin mutar los datos originales', () => {
    const data = initial();
    const before = structuredClone(data);
    const history = progressSummary(data, '4w', today).history;
    expect(history.map((record) => record.volumeKg)).toEqual([1820, 2450, 650, 2100]);
    expect(history.every((record) => record.status === 'completed')).toBe(true);
    expect(data).toEqual(before);
  });

  it('incluye ambos extremos del período y excluye sesiones futuras y anteriores', () => {
    const base = initial().workouts[0]!;
    const data = { weights: [], workouts: ['2026-10-02', '2026-10-03', today, '2026-10-31'].map((date, index) => ({ ...base, id: String(index), date, volumeKg: 100 })) };
    const summary = progressSummary(data, '4w', today);
    expect(summary).toMatchObject({ completed: 2, planned: 2, totalKg: 200 });
    expect(summary.points.map((point) => point.kg)).toEqual([100, 0, 0, 100]);
  });

  it('muestra ausencia de datos sin inventar adherencia, comparación ni peso', () => {
    const summary = progressSummary(createEmptyProgress(), '4w', today);
    expect(summary).toMatchObject({ completed: 0, planned: 0, totalKg: 0, adherence: null, changePercent: null, latestWeight: null, history: [] });
    expect(summary.points.every((point) => point.kg === 0)).toBe(true);
  });

  it('resuelve meses de distinta duración y cambios de año sin desbordar al mes siguiente', () => {
    expect(monthStart('2026-03-31', -1)).toBe('2026-02-01');
    expect(monthStart('2026-01-31', -2)).toBe('2025-11-01');
    expect(periodStart('4w', '2024-03-01')).toBe('2024-02-03');
  });
});

describe('registro de peso temporal', () => {
  it('admite coma o punto y rechaza formatos inválidos sin modificar el estado', () => {
    expect(parseWeight('71,4')).toBe(71.4);
    expect(parseWeight(' 71.45 ')).toBe(71.45);
    const state = initial();
    for (const value of ['', '0', '-2', 'Infinity', 'NaN', '1e2', '71,123', '71,2,3', '1000']) {
      expect(parseWeight(value)).toBeNull();
      expect(progressReducer(state, { type: 'record-weight', date: today, value })).toBe(state);
    }
    expect(progressReducer(state, { type: 'record-weight', date: '2026-02-30', value: '71' })).toBe(state);
  });

  it('añade o reemplaza el peso de hoy, conservando los otros días y la selección de período', () => {
    let state = progressReducer(initial(), { type: 'record-weight', date: today, value: '71,2' });
    expect(state.weights).toHaveLength(3);
    state = progressReducer(state, { type: 'select-period', period: '3m' });
    state = progressReducer(state, { type: 'record-weight', date: today, value: '71,1' });
    expect(state.weights).toHaveLength(3);
    expect(state.period).toBe('3m');
    expect(progressSummary(state, state.period, today).latestWeight).toEqual({ date: today, kg: 71.1 });
    expect(state.weights[0]).toEqual(initial().weights[0]);
  });

  it('añade una sesión finalizada al historial una sola vez, aunque se envíe de nuevo', () => {
    const record = { id: 'session-1', date: today, time: '19:40', name: 'Rutina A', durationMinutes: 48, volumeKg: 1200, status: 'completed' as const };
    let state = progressReducer(initial(), { type: 'record-workout', record });
    state = progressReducer(state, { type: 'record-workout', record });
    expect(state.workouts.filter((item) => item.id === 'session-1')).toHaveLength(1);
    expect(progressSummary(state, '4w', today).history[0]).toEqual(record);
    expect(progressReducer(state, { type: 'record-workout', record: { ...record, id: 'x', date: '2026-02-30' } })).toBe(state);
  });
});

describe('mapa de constancia', () => {
  it('en 4 semanas usa días alineados al lunes y marca los días fuera del período', () => {
    const { unit, cells } = consistencyMap(initial(), '4w', today);
    expect(unit).toBe('day');
    expect(cells.length % 7).toBe(0);
    expect(cells[0]!.key).toBe('2026-09-28');
    expect(cells.filter((cell) => cell.state === 'done')).toHaveLength(14);
    expect(cells.filter((cell) => cell.state === 'missed')).toHaveLength(2);
    expect(cells.find((cell) => cell.key === '2026-10-02')!.state).toBe('outside');
  });

  it('en 3 meses y un año agrupa por semana', () => {
    const map = consistencyMap(initial(), '3m', today);
    expect(map.unit).toBe('week');
    expect(map.cells.reduce((sum, cell) => sum + cell.sessions, 0)).toBe(16);
    expect(consistencyMap(initial(), '1y', today).cells.length).toBeGreaterThanOrEqual(48);
  });
});
