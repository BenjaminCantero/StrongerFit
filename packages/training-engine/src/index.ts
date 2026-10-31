import { catalog, CATALOG_VERSION, type Equipment, type Exercise, type Pattern } from './catalog';

export { catalog, CATALOG_VERSION, type Equipment, type Exercise, type Pattern } from './catalog';
export const RULE_VERSION = 'entrenamiento-0.1';

export type AthleteProfile = 'general' | 'strength-hypertrophy';
export type Level = 'beginner' | 'intermediate' | 'advanced';

// Parámetros por perfil (SRS 8.10, valores de referencia).
export const profiles: Record<AthleteProfile, {
  tempo: [number, number, number] | null;
  days: [number, number]; sets: [number, number]; reps: Record<Exercise['kind'], [number, number]>; rest: Record<Exercise['kind'], number>; minutes: [number, number];
}> = {
  general: { tempo: null, days: [2, 5], sets: [2, 4], reps: { compound: [8, 12], isolation: [8, 12], isometric: [20, 40] },
    rest: { compound: 90, isolation: 60, isometric: 60 }, minutes: [30, 60] },
  'strength-hypertrophy': { tempo: [3, 1, 1], days: [3, 6], sets: [3, 4], reps: { compound: [6, 10], isolation: [10, 15], isometric: [30, 45] },
    rest: { compound: 120, isolation: 75, isometric: 60 }, minutes: [45, 75] },
};

// Plantillas por frecuencia: cada día es una lista ordenada de patrones.
const fullBody: Pattern[][] = [['squat', 'push-h', 'pull-h', 'hinge', 'push-v', 'core', 'arms'], ['hinge', 'push-v', 'pull-v', 'lunge', 'push-h', 'core', 'arms']];
const upper: Pattern[] = ['push-h', 'pull-h', 'push-v', 'pull-v', 'arms', 'core'];
const lower: Pattern[] = ['squat', 'hinge', 'lunge', 'core', 'squat'];
const templates: Record<number, { names: string[]; days: Pattern[][] }> = {
  2: { names: ['Cuerpo completo A', 'Cuerpo completo B'], days: fullBody },
  3: { names: ['Cuerpo completo A', 'Cuerpo completo B', 'Cuerpo completo C'], days: [fullBody[0]!, fullBody[1]!, ['lunge', 'push-h', 'pull-v', 'hinge', 'push-v', 'core', 'arms']] },
  4: { names: ['Tren superior A', 'Tren inferior A', 'Tren superior B', 'Tren inferior B'], days: [upper, lower, ['pull-v', 'push-v', 'pull-h', 'push-h', 'arms', 'core'], ['hinge', 'squat', 'lunge', 'core', 'hinge']] },
  5: { names: ['Tren superior A', 'Tren inferior A', 'Empuje', 'Tracción', 'Piernas'], days: [upper, lower, ['push-h', 'push-v', 'push-h', 'arms', 'core'], ['pull-h', 'pull-v', 'pull-h', 'arms', 'core'], ['squat', 'hinge', 'lunge', 'core']] },
  6: { names: ['Empuje A', 'Tracción A', 'Piernas A', 'Empuje B', 'Tracción B', 'Piernas B'], days: [['push-h', 'push-v', 'push-h', 'arms', 'core'], ['pull-v', 'pull-h', 'pull-h', 'arms', 'core'], ['squat', 'hinge', 'lunge', 'core'], ['push-v', 'push-h', 'push-v', 'arms', 'core'], ['pull-h', 'pull-v', 'pull-v', 'arms', 'core'], ['hinge', 'squat', 'lunge', 'core']] },
};

export type PlanInput = { days: number; minutes: number; equipment: Equipment[]; athleteProfile: AthleteProfile; level: Level; injury: boolean };
// tempo: segundos de bajada, pausa y subida (tiempo bajo tensión, SRS 8.9).
export type PlannedExercise = { exerciseId: string; sets: number; repsMin: number; repsMax: number; restSeconds: number; tempo?: [number, number, number] };
export type PlanDay = { name: string; exercises: PlannedExercise[] };
export type Plan = { ruleVersion: string; catalogVersion: string; input: PlanInput; days: PlanDay[]; warnings: ('injury-review' | 'missing-patterns')[] };

export const exerciseById = (id: string) => catalog.find((exercise) => exercise.id === id);
const clamp = (value: number, [min, max]: [number, number]) => Math.min(max, Math.max(min, value));

// BR-03: solo ejercicios cuyo equipo está disponible. Peso corporal siempre lo está.
export function available(equipment: Equipment[]) {
  const owned = new Set<Equipment>([...equipment, 'bodyweight']);
  return catalog.filter((exercise) => exercise.equipment.some((item) => owned.has(item)));
}

export function generatePlan(input: PlanInput): Plan {
  const profile = profiles[input.athleteProfile];
  const days = clamp(input.days, profile.days);
  const template = templates[days]!;
  const pool = available(input.equipment);
  const perDay = clamp(Math.floor(clamp(input.minutes, profile.minutes) / 10), [3, 7]);
  const sets = input.level === 'beginner' ? profile.sets[0] : input.level === 'advanced' ? profile.sets[1] : Math.round((profile.sets[0] + profile.sets[1]) / 2);
  let missing = false;
  const plan = template.days.map((patterns, dayIndex) => {
    const used = new Set<string>();
    const exercises: PlannedExercise[] = [];
    for (const pattern of patterns) {
      if (exercises.length >= perDay) break;
      // Rotación determinista entre opciones del mismo patrón para variar días.
      const options = pool.filter((exercise) => exercise.pattern === pattern && !used.has(exercise.id));
      if (!options.length) { missing = true; continue; }
      const exercise = options[dayIndex % options.length]!;
      used.add(exercise.id);
      const [repsMin, repsMax] = profile.reps[exercise.kind];
      exercises.push({ exerciseId: exercise.id, sets, repsMin, repsMax, restSeconds: profile.rest[exercise.kind],
        ...(profile.tempo && exercise.kind !== 'isometric' ? { tempo: profile.tempo } : {}) });
    }
    return { name: template.names[dayIndex]!, exercises };
  });
  const warnings: Plan['warnings'] = [];
  if (input.injury) warnings.push('injury-review');
  if (missing) warnings.push('missing-patterns');
  return { ruleVersion: RULE_VERSION, catalogVersion: CATALOG_VERSION, input: { ...input, days }, days: plan, warnings };
}

// CA-12: ediciones dentro de rangos coherentes y sin equipo no declarado.
export function validateExercise(item: PlannedExercise, equipment: Equipment[]): string | null {
  const exercise = exerciseById(item.exerciseId);
  if (!exercise) return 'El ejercicio no existe en el catálogo.';
  if (!available(equipment).some((option) => option.id === exercise.id)) return 'Requiere equipamiento que no declaraste.';
  if (!Number.isInteger(item.sets) || item.sets < 1 || item.sets > 6) return 'Usa entre 1 y 6 series.';
  if (!Number.isInteger(item.repsMin) || !Number.isInteger(item.repsMax) || item.repsMin < 1 || item.repsMax > 60 || item.repsMin > item.repsMax) {
    return 'Usa un rango de repeticiones entre 1 y 60.';
  }
  if (!Number.isInteger(item.restSeconds) || item.restSeconds < 15 || item.restSeconds > 300) return 'Usa un descanso entre 15 y 300 segundos.';
  return null;
}

export function swapOptions(item: PlannedExercise, equipment: Equipment[]) {
  const current = exerciseById(item.exerciseId);
  return available(equipment).filter((exercise) => exercise.pattern === current?.pattern && exercise.id !== item.exerciseId);
}
