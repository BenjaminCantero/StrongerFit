import { describe, expect, it } from 'vitest';
import { estimateLoad, loadStep, overloadSuggestion, roundToStep } from './loads';

describe('carga por calibración (CA-26)', () => {
  const calibration = { weightKg: 40, reps: 8, reserve: 2 };
  it('estima con Epley y redondea al escalón', () => {
    expect(estimateLoad(calibration, 8, 2.5)).toBe(42.5);
    expect(estimateLoad(calibration, 12, 2.5)).toBe(37.5);
  });
  it('redondea con empate hacia abajo', () => {
    expect(roundToStep(41.25, 2.5)).toBe(40);
    expect(roundToStep(41.3, 2.5)).toBe(42.5);
    expect(roundToStep(37, 5)).toBe(35);
  });
  it('no supera el 110 % de la carga de calibración', () => {
    for (const reps of [1, 3, 5, 6, 8, 12, 15]) expect(estimateLoad(calibration, reps, 2.5)).toBeLessThanOrEqual(44);
    expect(estimateLoad(calibration, 3, 2.5)).toBe(42.5);
  });
  it('usa 5 kg en máquinas y 2,5 kg en el resto', () => {
    expect(loadStep({ equipment: ['machines'] })).toBe(5);
    expect(loadStep({ equipment: ['dumbbells', 'bands'] })).toBe(2.5);
  });
});

describe('sobrecarga sugerida (CA-27)', () => {
  it('sugiere un escalón más solo si todas las series llegan al máximo', () => {
    expect(overloadSuggestion([12, 12, 12].map((reps) => ({ weightKg: 40, reps })), 12, 2.5)).toBe(42.5);
    expect(overloadSuggestion([12, 12, 11].map((reps) => ({ weightKg: 40, reps })), 12, 2.5)).toBeNull();
    expect(overloadSuggestion([], 12, 2.5)).toBeNull();
    expect(overloadSuggestion([{ weightKg: 0, reps: 15 }], 12, 2.5)).toBeNull();
  });
});
