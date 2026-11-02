import type { Equipment, Kind } from './catalog';

// Plantillas propias: 4 entornos × 2 niveles × 3 frecuencias (SRS 8.11, RF-05, RF-31).
// Valores de referencia sujetos a revisión profesional registrada fuera del paquete (BR-26).
export const TEMPLATE_VERSION = 'plantillas-0.1';

export type Environment = 'none' | 'calisthenics' | 'small-gym' | 'commercial-gym';
export type TemplateLevel = 'beginner' | 'intermediate';
export const frequencies = [3, 4, 5] as const;
export type Frequency = (typeof frequencies)[number];

export const environmentLabels: Record<Environment, string> = {
  none: 'Sin equipo', calisthenics: 'Calistenia', 'small-gym': 'Gimnasio pequeño', 'commercial-gym': 'Gimnasio comercial',
};
export const environmentEquipment: Record<Environment, Equipment[]> = {
  none: ['bodyweight'],
  calisthenics: ['bodyweight', 'bands'],
  'small-gym': ['bodyweight', 'dumbbells', 'barbell', 'bands'],
  'commercial-gym': ['bodyweight', 'dumbbells', 'barbell', 'bands', 'machines'],
};

type Slot = 'squat' | 'squat2' | 'hinge' | 'hinge2' | 'lunge' | 'pushH' | 'pushH2' | 'pushV' | 'pullH' | 'pullH2' | 'pullV'
  | 'core' | 'core2' | 'arms' | 'arms2' | 'calves';

// Ejercicio elegido para cada hueco según entorno y nivel; null si el entorno no tiene una opción adecuada.
const slots: Record<Environment, Record<TemplateLevel, Record<Slot, string | null>>> = {
  none: {
    beginner: { squat: 'bodyweight-squat', squat2: 'box-squat', hinge: 'glute-bridge', hinge2: 'glute-bridge', lunge: 'reverse-lunge',
      pushH: 'incline-push-up', pushH2: 'knee-push-up', pushV: 'pike-push-up', pullH: 'prone-y-raise', pullH2: 'superman-hold', pullV: null,
      core: 'plank', core2: 'dead-bug', arms: null, arms2: 'bench-dip', calves: 'standing-calf-raise' },
    intermediate: { squat: 'bodyweight-squat', squat2: 'jump-squat', hinge: 'glute-bridge', hinge2: 'single-leg-glute-bridge', lunge: 'bulgarian-split-squat',
      pushH: 'push-up', pushH2: 'decline-push-up', pushV: 'pike-push-up', pullH: 'prone-y-raise', pullH2: 'superman-hold', pullV: null,
      core: 'plank', core2: 'hollow-hold', arms: null, arms2: 'bench-dip', calves: 'single-leg-calf-raise' },
  },
  calisthenics: {
    beginner: { squat: 'bodyweight-squat', squat2: 'band-squat', hinge: 'glute-bridge', hinge2: 'band-pull-through', lunge: 'reverse-lunge',
      pushH: 'incline-push-up', pushH2: 'band-chest-press', pushV: 'band-overhead-press', pullH: 'band-row', pullH2: 'band-face-pull', pullV: 'band-pulldown',
      core: 'plank', core2: 'pallof-press', arms: 'band-curl', arms2: 'band-triceps', calves: 'standing-calf-raise' },
    intermediate: { squat: 'bodyweight-squat', squat2: 'jump-squat', hinge: 'single-leg-glute-bridge', hinge2: 'band-good-morning', lunge: 'bulgarian-split-squat',
      pushH: 'push-up', pushH2: 'decline-push-up', pushV: 'pike-push-up', pullH: 'band-row', pullH2: 'band-pull-apart', pullV: 'band-pulldown',
      core: 'plank', core2: 'hollow-hold', arms: 'band-curl', arms2: 'bench-dip', calves: 'single-leg-calf-raise' },
  },
  'small-gym': {
    beginner: { squat: 'goblet-squat', squat2: 'db-squat', hinge: 'db-romanian-deadlift', hinge2: 'db-hip-thrust', lunge: 'reverse-lunge',
      pushH: 'db-bench-press', pushH2: 'incline-db-press', pushV: 'db-shoulder-press', pullH: 'db-row', pullH2: 'chest-supported-row', pullV: 'band-pulldown',
      core: 'plank', core2: 'dead-bug', arms: 'db-curl', arms2: 'overhead-db-extension', calves: 'standing-calf-raise' },
    intermediate: { squat: 'back-squat', squat2: 'goblet-squat', hinge: 'romanian-deadlift', hinge2: 'hip-thrust', lunge: 'bulgarian-split-squat',
      pushH: 'bench-press', pushH2: 'incline-db-press', pushV: 'overhead-press', pullH: 'barbell-row', pullH2: 'db-row', pullV: 'band-pulldown',
      core: 'plank', core2: 'hollow-hold', arms: 'hammer-curl', arms2: 'skull-crusher', calves: 'barbell-calf-raise' },
  },
  'commercial-gym': {
    beginner: { squat: 'leg-press', squat2: 'goblet-squat', hinge: 'db-romanian-deadlift', hinge2: 'leg-curl', lunge: 'step-up',
      pushH: 'chest-press-machine', pushH2: 'db-bench-press', pushV: 'machine-shoulder-press', pullH: 'machine-row', pullH2: 'db-row', pullV: 'lat-pulldown',
      core: 'plank', core2: 'machine-crunch', arms: 'db-curl', arms2: 'machine-triceps-extension', calves: 'seated-calf-raise' },
    intermediate: { squat: 'back-squat', squat2: 'hack-squat', hinge: 'romanian-deadlift', hinge2: 'hip-thrust', lunge: 'walking-lunge',
      pushH: 'bench-press', pushH2: 'incline-db-press', pushV: 'overhead-press', pullH: 'barbell-row', pullH2: 'machine-row', pullV: 'lat-pulldown',
      core: 'plank', core2: 'machine-crunch', arms: 'barbell-curl', arms2: 'skull-crusher', calves: 'seated-calf-raise' },
  },
};

// Estructura de días por frecuencia; el principiante hace como máximo 5 ejercicios por sesión.
const layouts: Record<Frequency, { name: string; slots: Slot[] }[]> = {
  3: [
    { name: 'Cuerpo completo A', slots: ['squat', 'pushH', 'pullH', 'hinge', 'core', 'arms'] },
    { name: 'Cuerpo completo B', slots: ['hinge', 'pushV', 'pullV', 'lunge', 'core2', 'arms2'] },
    { name: 'Cuerpo completo C', slots: ['squat2', 'pushH2', 'pullH2', 'hinge2', 'core', 'calves'] },
  ],
  4: [
    { name: 'Tren superior A', slots: ['pushH', 'pullH', 'pushV', 'pullV', 'arms', 'arms2'] },
    { name: 'Tren inferior A', slots: ['squat', 'hinge', 'lunge', 'calves', 'core'] },
    { name: 'Tren superior B', slots: ['pushH2', 'pullH2', 'pushV', 'pullV', 'arms', 'core2'] },
    { name: 'Tren inferior B', slots: ['hinge2', 'squat2', 'lunge', 'calves', 'core'] },
  ],
  5: [
    { name: 'Tren superior', slots: ['pushH', 'pullH', 'pushV', 'pullV', 'core'] },
    { name: 'Tren inferior', slots: ['squat', 'hinge', 'lunge', 'calves', 'core2'] },
    { name: 'Empuje', slots: ['pushH2', 'pushV', 'pushH', 'arms2', 'core'] },
    { name: 'Tracción', slots: ['pullH2', 'pullV', 'pullH', 'arms', 'core2'] },
    { name: 'Piernas', slots: ['squat2', 'hinge2', 'lunge', 'calves'] },
  ],
};

// Prescripción por nivel y tipo de ejercicio; las repeticiones de isométricos son segundos.
export const prescriptions: Record<TemplateLevel, Record<Kind, { sets: number; reps: [number, number]; rest: number }>> = {
  beginner: { compound: { sets: 3, reps: [8, 12], rest: 90 }, isolation: { sets: 2, reps: [10, 15], rest: 60 }, isometric: { sets: 2, reps: [20, 40], rest: 60 } },
  intermediate: { compound: { sets: 3, reps: [6, 10], rest: 120 }, isolation: { sets: 3, reps: [10, 15], rest: 75 }, isometric: { sets: 3, reps: [30, 45], rest: 60 } },
};

export const weekdayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
// Días repartidos evitando días consecutivos cuando es posible (SRS 8.11).
export const weekdays: Record<Frequency, number[]> = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5] };

export type Template = { id: string; environment: Environment; level: TemplateLevel; days: Frequency; plan: { name: string; exerciseIds: string[] }[] };

export const templates: Template[] = (Object.keys(slots) as Environment[]).flatMap((environment) =>
  (['beginner', 'intermediate'] as const).flatMap((level) => frequencies.map((days) => ({
    id: `${environment}-${level}-${days}d`, environment, level, days,
    plan: layouts[days].map((day) => ({
      name: day.name,
      exerciseIds: day.slots.map((slot) => slots[environment][level][slot]).filter((id): id is string => id !== null).slice(0, level === 'beginner' ? 5 : 6),
    })),
  }))));

// Frecuencia exacta o la cubierta más cercana, con empate hacia abajo.
export const nearestFrequency = (days: number): Frequency =>
  [...frequencies].sort((a, b) => Math.abs(a - days) - Math.abs(b - days) || a - b)[0]!;

export function selectTemplate(environment: Environment, level: TemplateLevel, days: number): Template {
  const frequency = nearestFrequency(days);
  const matches = templates.filter((item) => item.environment === environment && item.level === level && item.days === frequency);
  if (matches.length !== 1) throw new Error(`Se esperaba una plantilla para ${environment}/${level}/${frequency} y hay ${matches.length}.`);
  return matches[0]!;
}
