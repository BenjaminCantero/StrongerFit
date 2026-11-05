import { catalog, type Equipment, type Exercise, type Zone } from './catalog';

// Reglas compartidas por el generador de planes (index.ts) y los programas clásicos
// (programs.ts). Viven aquí para que ambos apliquen exactamente el mismo criterio.

export const exerciseById = (id: string) => catalog.find((exercise) => exercise.id === id);

// BR-03: el peso corporal siempre está disponible.
export const owns = (equipment: Equipment[]) => {
  const owned = new Set<Equipment>([...equipment, 'bodyweight']);
  return (exercise: Exercise) => exercise.equipment.some((item) => owned.has(item));
};

export const contraindicated = (exercise: Exercise, zones: Zone[]) =>
  exercise.contraindications !== 'none-validated' && exercise.contraindications.some((zone) => zones.includes(zone));

// Techo de sustituciones: el máximo entre 1 y el 20 % de los ejercicios, hacia abajo (BR-25).
export const substitutionCeiling = (count: number) => Math.max(1, Math.floor(count * 0.2));
