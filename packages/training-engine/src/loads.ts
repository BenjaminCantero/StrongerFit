import type { Exercise } from './catalog';

// Carga inicial por calibración y sobrecarga progresiva (SRS 8.13, BR-22 a BR-24).
// Escalones y topes son valores de referencia propios pendientes de validar con un entrenador.
export const LOAD_RULE_VERSION = 'cargas-0.1';
export const DEFAULT_RESERVE = 2;
export const MAX_RESERVE = 5;
const EPSILON = 1e-9;

// Máquinas 5 kg; mancuernas y barra 2,5 kg.
export const loadStep = (exercise: Pick<Exercise, 'equipment'>) =>
  exercise.equipment.length && exercise.equipment.every((item) => item === 'machines') ? 5 : 2.5;

// Escalón más cercano; en empate, hacia abajo.
export function roundToStep(value: number, step: number) {
  const below = Math.floor(value / step + EPSILON) * step;
  const above = below + step;
  return value - below > above - value + EPSILON ? above : below;
}

// Epley: 1RM = w × (1 + (r + s) ÷ 30), con s repeticiones en reserva.
export const estimatedOneRepMax = (weightKg: number, reps: number, reserve: number) => weightKg * (1 + (reps + reserve) / 30);

export type Calibration = { weightKg: number; reps: number; reserve: number };

// Carga estimada para R repeticiones, redondeada al escalón y sin superar el 110 % de la calibración (BR-23).
export function estimateLoad(calibration: Calibration, targetReps: number, step: number) {
  const oneRepMax = estimatedOneRepMax(calibration.weightKg, calibration.reps, calibration.reserve);
  const rounded = roundToStep(oneRepMax / (1 + targetReps / 30), step);
  const cap = calibration.weightKg * 1.1;
  return rounded > cap + EPSILON ? Math.floor(cap / step + EPSILON) * step : rounded;
}

// Doble progresión (BR-24): si todas las series llegaron al máximo del rango, sugiere un escalón más
// sobre la menor carga usada; si no, ninguna sugerencia.
export function overloadSuggestion(sets: { weightKg: number; reps: number }[], repsMax: number, step: number): number | null {
  if (!sets.length || sets.some((set) => set.reps < repsMax)) return null;
  const load = Math.min(...sets.map((set) => set.weightKg));
  return load > 0 ? roundToStep(load + step, step) : null;
}
