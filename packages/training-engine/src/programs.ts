// Programas clásicos de fuerza e hipertrofia, transcritos al catálogo propio.
//
// Estructura (días, series, rangos de repeticiones, RIR y descansos) adaptada de
// GymCoach, lib/programs/templates.ts — https://github.com/gymcoach-app/gymcoach
// Copyright (c) 2026 GymCoach contributors. Licencia MIT; texto completo en
// THIRD_PARTY_NOTICES.md en la raíz del repositorio.
//
// Cambios respecto del original: textos traducidos al español; ejercicios
// asociados al catálogo propio (las aproximaciones se indican en `note`);
// se omite nSuns porque usa 8–9 series por ejercicio, fuera de los rangos
// validados por validateExercise. Son transcripciones no oficiales: los
// nombres identifican el programa de su autor y no implican respaldo.
//
// Las reglas de carga específicas (porcentajes de 5/3/1, etapas de GZCLP) se
// describen en las notas; el motor aún aplica la doble progresión de loads.ts.

import { CATALOG_VERSION } from './catalog';
import type { Level, Plan, PlanChange, PlanInput, PlannedExercise } from './index';
import { contraindicated, exerciseById, owns, substitutionCeiling } from './rules';

export const PROGRAMS_VERSION = 'programas-0.1';
export const PROGRAMS_SOURCE = {
  source: 'GymCoach — lib/programs/templates.ts', url: 'https://github.com/gymcoach-app/gymcoach',
  license: 'MIT', copyright: 'Copyright (c) 2026 GymCoach contributors', retrieved: '2026-11-04',
} as const;

export type ProgramFocus = 'strength' | 'hypertrophy' | 'general';
export type ProgramExercise = PlannedExercise & { rir: number; note?: string };
export type ProgramDay = { name: string; weekday: number; exercises: ProgramExercise[] };
export type Program = {
  id: string; name: string; summary: string; howTo: string; author: string | null;
  // Sesiones por semana; si es mayor que days.length, las sesiones se alternan (A/B/A, B/A/B…).
  focus: ProgramFocus; level: Level; perWeek: number; days: ProgramDay[];
};

// weekday: 0 = lunes, como weekdayLabels.
const x = (exerciseId: string, sets: number, repsMin: number, repsMax: number, rir: number, restSeconds: number, note?: string): ProgramExercise =>
  ({ exerciseId, sets, repsMin, repsMax, rir, restSeconds, ...(note ? { note } : {}) });

const BBB = 'Complementario Boring But Big: 5×10 al 50–60 % del máximo de entrenamiento.';
const MAIN_531 = 'Principal: ola 5/3/1 sobre el máximo de entrenamiento (90 % del 1RM); última serie al máximo de repeticiones.';
const GZ_T1 = 'T1: 5×3, última serie al máximo de repeticiones. Sube carga cada sesión; si fallas, pasa a 6×2 y luego 10×1.';
const GZ_T2 = 'T2: 3×10; si fallas, pasa a 3×8 y luego 3×6.';
const GZ_T3 = 'T3: 3×15, última serie al máximo de repeticiones. Sube carga cuando llegues a 25.';
const PULLUP = 'Original: dominadas. Si tienes barra, puedes hacerlas en su lugar.';
const CHINUP = 'Original: dominadas supinas. Si tienes barra, puedes hacerlas en su lugar.';
const PUSHDOWN = 'Original: extensión de tríceps en polea.';
const CABLE_FLY = 'Original: aperturas en polea.';
const CABLE_CURL = 'Original: curl en polea.';
const CABLE_ROW = 'Original: remo sentado en polea.';
const HANGING = 'Original: elevaciones de piernas colgado.';

export const programs: Program[] = [
  {
    id: '531-bbb-4day', name: '5/3/1 Boring But Big', author: 'Jim Wendler', focus: 'strength', level: 'intermediate', perWeek: 4,
    summary: 'Un básico por día con la ola 5/3/1 y 5×10 de volumen complementario. 4 días.',
    howTo: 'Fija tu máximo de entrenamiento en el 90 % de tu 1RM. Cada semana la serie principal sigue la ola 5s/3s/1s y la última serie va al máximo de repeticiones. Progresa el máximo de entrenamiento, no la carga del día.',
    days: [
      { name: 'Día 1 · Press militar', weekday: 0, exercises: [
        x('overhead-press', 3, 1, 5, 1, 180, MAIN_531), x('overhead-press', 5, 10, 10, 3, 90, BBB), x('close-grip-pulldown', 5, 8, 12, 2, 90, CHINUP)] },
      { name: 'Día 2 · Peso muerto', weekday: 2, exercises: [
        x('deadlift', 3, 1, 5, 1, 240, MAIN_531), x('deadlift', 5, 10, 10, 3, 120, BBB), x('lying-leg-raise', 4, 10, 15, 2, 60, HANGING)] },
      { name: 'Día 3 · Press de banca', weekday: 4, exercises: [
        x('bench-press', 3, 1, 5, 1, 180, MAIN_531), x('bench-press', 5, 10, 10, 3, 90, BBB), x('barbell-row', 5, 8, 12, 2, 90)] },
      { name: 'Día 4 · Sentadilla', weekday: 5, exercises: [
        x('back-squat', 3, 1, 5, 1, 240, MAIN_531), x('back-squat', 5, 10, 10, 3, 120, BBB), x('leg-curl', 4, 10, 15, 2, 60)] },
    ],
  },
  {
    id: 'gzclp-3day', name: 'GZCLP', author: 'Cody Lefever', focus: 'strength', level: 'beginner', perWeek: 3,
    summary: 'Progresión lineal por niveles: T1 pesado 5×3, T2 de volumen 3×10 y T3 accesorio 3×15+. 3 días.',
    howTo: 'Sube la carga cada sesión mientras completes las repeticiones. Al estancarte, cambia al siguiente esquema de repeticiones del nivel en vez de bajar la carga de inmediato.',
    days: [
      { name: 'Día A · Sentadilla / Banca', weekday: 0, exercises: [
        x('back-squat', 5, 3, 3, 1, 180, GZ_T1), x('bench-press', 3, 10, 10, 2, 120, GZ_T2), x('lat-pulldown', 3, 15, 25, 2, 90, GZ_T3)] },
      { name: 'Día B · Press militar / Peso muerto', weekday: 2, exercises: [
        x('overhead-press', 5, 3, 3, 1, 180, GZ_T1), x('deadlift', 3, 10, 10, 2, 150, GZ_T2), x('db-row', 3, 15, 25, 2, 90, GZ_T3)] },
      { name: 'Día C · Banca / Sentadilla', weekday: 4, exercises: [
        x('bench-press', 5, 3, 3, 1, 180, GZ_T1), x('back-squat', 3, 10, 10, 2, 120, GZ_T2), x('machine-curl', 3, 15, 25, 2, 60, `${GZ_T3} ${CABLE_CURL}`)] },
    ],
  },
  {
    id: 'ppl-6day', name: 'Empuje / Tirón / Pierna', author: null, focus: 'hypertrophy', level: 'intermediate', perWeek: 6,
    summary: 'División clásica de hipertrofia, cada sesión dos veces por semana. 6 días.',
    howTo: 'Trabaja en rangos de 6–20 repeticiones dejando 1–2 en reserva. Sube la carga cuando completes el tope del rango en todas las series.',
    days: [
      { name: 'Empuje A', weekday: 0, exercises: [
        x('bench-press', 4, 6, 10, 1, 150), x('overhead-press', 3, 8, 12, 2, 120), x('incline-db-press', 3, 10, 12, 1, 90),
        x('lateral-raise', 4, 12, 20, 1, 60), x('machine-triceps-extension', 3, 10, 15, 1, 60, PUSHDOWN)] },
      { name: 'Tirón A', weekday: 1, exercises: [
        x('deadlift', 3, 5, 8, 2, 180), x('lat-pulldown', 4, 6, 12, 1, 120, PULLUP), x('barbell-row', 3, 8, 12, 2, 120),
        x('band-face-pull', 3, 15, 20, 1, 60), x('barbell-curl', 3, 8, 12, 1, 60)] },
      { name: 'Pierna A', weekday: 2, exercises: [
        x('back-squat', 4, 6, 10, 1, 180), x('romanian-deadlift', 3, 8, 12, 2, 120), x('leg-press', 3, 10, 15, 1, 90),
        x('leg-curl', 3, 10, 15, 1, 60), x('standing-calf-raise', 4, 10, 15, 1, 60)] },
      { name: 'Empuje B', weekday: 3, exercises: [
        x('overhead-press', 4, 6, 10, 1, 150), x('incline-db-press', 3, 8, 12, 2, 120), x('pec-deck', 3, 12, 15, 1, 60, CABLE_FLY),
        x('lateral-raise', 4, 12, 20, 1, 60), x('overhead-db-extension', 3, 10, 15, 1, 60)] },
      { name: 'Tirón B', weekday: 4, exercises: [
        x('lat-pulldown', 4, 8, 12, 1, 120), x('machine-row', 3, 8, 12, 2, 120, CABLE_ROW), x('db-row', 3, 10, 12, 1, 90),
        x('rear-delt-fly', 3, 15, 20, 1, 60), x('hammer-curl', 3, 10, 15, 1, 60)] },
      { name: 'Pierna B', weekday: 5, exercises: [
        x('front-squat', 4, 6, 10, 1, 180), x('romanian-deadlift', 3, 8, 12, 2, 120), x('bulgarian-split-squat', 3, 8, 12, 1, 90),
        x('leg-extension', 3, 12, 15, 1, 60), x('seated-calf-raise', 4, 12, 20, 1, 60)] },
    ],
  },
  {
    id: 'upper-lower-4day', name: 'Torso / Pierna', author: null, focus: 'hypertrophy', level: 'intermediate', perWeek: 4,
    summary: 'División de 4 días que combina un básico pesado con volumen de hipertrofia.',
    howTo: 'Empieza cada sesión con el compuesto pesado (5–8 repeticiones) y sigue con accesorios de 8–15. Sube la carga al llegar al tope de cada rango.',
    days: [
      { name: 'Torso A', weekday: 0, exercises: [
        x('bench-press', 4, 5, 8, 1, 180), x('barbell-row', 4, 6, 10, 1, 150), x('overhead-press', 3, 8, 12, 2, 120),
        x('lat-pulldown', 3, 10, 12, 1, 90), x('barbell-curl', 3, 8, 12, 1, 60), x('machine-triceps-extension', 3, 10, 15, 1, 60, PUSHDOWN)] },
      { name: 'Pierna A', weekday: 1, exercises: [
        x('back-squat', 4, 5, 8, 1, 180), x('romanian-deadlift', 3, 8, 12, 2, 150), x('leg-press', 3, 10, 15, 1, 90),
        x('leg-curl', 3, 10, 15, 1, 60), x('standing-calf-raise', 4, 10, 15, 1, 60)] },
      { name: 'Torso B', weekday: 3, exercises: [
        x('overhead-press', 4, 5, 8, 1, 180), x('lat-pulldown', 4, 6, 10, 1, 150, PULLUP), x('incline-db-press', 3, 8, 12, 2, 120),
        x('machine-row', 3, 10, 12, 1, 90, CABLE_ROW), x('lateral-raise', 4, 12, 20, 1, 60), x('hammer-curl', 3, 10, 15, 1, 60)] },
      { name: 'Pierna B', weekday: 4, exercises: [
        x('deadlift', 3, 4, 6, 2, 240), x('front-squat', 3, 6, 10, 1, 150), x('bulgarian-split-squat', 3, 8, 12, 1, 90),
        x('leg-extension', 3, 12, 15, 1, 60), x('seated-calf-raise', 4, 12, 20, 1, 60)] },
    ],
  },
  {
    id: 'starting-strength-3day', name: 'Starting Strength', author: 'Mark Rippetoe', focus: 'strength', level: 'beginner', perWeek: 3,
    summary: 'Progresión lineal para principiantes: dos sesiones de cuerpo completo alternadas, 3×5. 3 días.',
    howTo: 'Alterna las sesiones A y B en tres días por semana. Sentadilla 3×5 en todas; sube 2,5–5 kg cada vez que completes todas las repeticiones. Si te estancas, baja un 10 %.',
    days: [
      { name: 'Sesión A · Sentadilla / Banca / Peso muerto', weekday: 0, exercises: [
        x('back-squat', 3, 5, 5, 1, 240, '3×5. Sube 2,5–5 kg cada sesión si completas todo.'),
        x('bench-press', 3, 5, 5, 1, 180, '3×5. Sube carga cada sesión si completas todo.'),
        x('deadlift', 1, 5, 5, 1, 240, '1×5 de trabajo. Sube carga cada sesión.')] },
      { name: 'Sesión B · Sentadilla / Press / Tirón', weekday: 2, exercises: [
        x('back-squat', 3, 5, 5, 1, 240, '3×5. Sube 2,5–5 kg cada sesión si completas todo.'),
        x('overhead-press', 3, 5, 5, 1, 180, '3×5. Sube carga cada sesión si completas todo.'),
        x('barbell-row', 5, 3, 3, 2, 180, 'Original: cargada de potencia 5×3. El programa permite remo con barra para principiantes.')] },
    ],
  },
  {
    id: 'stronglifts-5x5-3day', name: 'StrongLifts 5×5', author: 'Mehdi Hadim', focus: 'strength', level: 'beginner', perWeek: 3,
    summary: 'Dos sesiones de cuerpo completo alternadas, 5×5 en los básicos y carga en cada sesión. 3 días.',
    howTo: 'Alterna A y B en tres días por semana. Sube 2,5 kg cada sesión en que completes las 5×5; tras tres fallos seguidos, baja un 10 %.',
    days: [
      { name: 'Sesión A · Sentadilla / Banca / Remo', weekday: 0, exercises: [
        x('back-squat', 5, 5, 5, 1, 240, '5×5. Sube 2,5 kg cada sesión si completas todo.'),
        x('bench-press', 5, 5, 5, 1, 180, '5×5. Sube carga cada sesión si completas todo.'),
        x('barbell-row', 5, 5, 5, 1, 180, '5×5. Sube carga cada sesión si completas todo.')] },
      { name: 'Sesión B · Sentadilla / Press / Peso muerto', weekday: 2, exercises: [
        x('back-squat', 5, 5, 5, 1, 240, '5×5. Sube 2,5 kg cada sesión si completas todo.'),
        x('overhead-press', 5, 5, 5, 1, 180, '5×5. Sube carga cada sesión si completas todo.'),
        x('deadlift', 1, 5, 5, 1, 240, '1×5 de trabajo. Sube carga cada sesión.')] },
    ],
  },
  {
    id: 'madcow-5x5-3day', name: 'Madcow 5×5', author: null, focus: 'strength', level: 'intermediate', perWeek: 3,
    summary: 'Progresión semanal: lunes pesado en rampa, miércoles liviano y viernes con serie récord. 3 días.',
    howTo: 'El lunes sube en rampa hasta una serie máxima de 5; el miércoles es volumen de recuperación; el viernes rampa hasta un triple pesado y una serie de descarga. Sube la carga de semana en semana, no de sesión en sesión.',
    days: [
      { name: 'Lunes · Rampa pesada', weekday: 0, exercises: [
        x('back-squat', 5, 5, 5, 1, 240, 'Rampa de 5 series hasta una serie máxima de 5.'),
        x('bench-press', 5, 5, 5, 1, 180, 'Rampa de 5 series hasta una serie máxima de 5.'),
        x('barbell-row', 5, 5, 5, 1, 180, 'Rampa de 5 series hasta una serie máxima de 5.')] },
      { name: 'Miércoles · Liviano', weekday: 2, exercises: [
        x('back-squat', 4, 5, 5, 3, 180, 'Volumen de recuperación hasta la carga de la 3.ª serie del lunes.'),
        x('overhead-press', 4, 5, 5, 3, 150, 'Volumen de recuperación.'),
        x('deadlift', 4, 5, 5, 2, 180, 'Rampa liviana; el tirón pesado queda para la progresión semanal.')] },
      { name: 'Viernes · Serie récord', weekday: 4, exercises: [
        x('back-squat', 4, 3, 5, 0, 240, 'Rampa hasta un triple pesado y luego una serie de descarga de 8.'),
        x('bench-press', 4, 3, 5, 0, 180, 'Rampa hasta un triple pesado y luego una serie de descarga.'),
        x('barbell-row', 4, 3, 5, 1, 180, 'Rampa hasta una serie pesada y luego una de descarga.')] },
    ],
  },
  {
    id: 'phul-4day', name: 'PHUL', author: 'Brandon Campbell', focus: 'hypertrophy', level: 'intermediate', perWeek: 4,
    summary: 'Torso/pierna con dos días de fuerza (3–5 reps) y dos de hipertrofia (8–15 reps). 4 días.',
    howTo: 'Progresa la carga en los días de fuerza; en los de hipertrofia busca completar el rango de repeticiones y acumular volumen.',
    days: [
      { name: 'Torso · Fuerza', weekday: 0, exercises: [
        x('bench-press', 4, 3, 5, 1, 180), x('barbell-row', 4, 3, 5, 1, 180), x('overhead-press', 3, 5, 8, 2, 150),
        x('lat-pulldown', 3, 6, 10, 2, 120), x('barbell-curl', 3, 6, 10, 1, 60), x('machine-triceps-extension', 3, 6, 10, 1, 60, PUSHDOWN)] },
      { name: 'Pierna · Fuerza', weekday: 1, exercises: [
        x('back-squat', 4, 3, 5, 1, 240), x('deadlift', 4, 3, 5, 1, 240), x('leg-press', 3, 8, 12, 2, 120),
        x('leg-curl', 3, 8, 12, 1, 60), x('standing-calf-raise', 4, 8, 12, 1, 60)] },
      { name: 'Torso · Hipertrofia', weekday: 3, exercises: [
        x('incline-db-press', 4, 8, 12, 1, 120), x('machine-row', 4, 8, 12, 1, 120, CABLE_ROW), x('pec-deck', 3, 12, 15, 1, 60, CABLE_FLY),
        x('lateral-raise', 4, 12, 20, 1, 60), x('hammer-curl', 3, 10, 15, 1, 60), x('overhead-db-extension', 3, 10, 15, 1, 60)] },
      { name: 'Pierna · Hipertrofia', weekday: 4, exercises: [
        x('front-squat', 4, 8, 12, 1, 150), x('romanian-deadlift', 3, 8, 12, 1, 120), x('leg-extension', 3, 12, 15, 1, 60),
        x('leg-curl', 3, 12, 15, 1, 60), x('seated-calf-raise', 4, 12, 20, 1, 60)] },
    ],
  },
  {
    id: 'phat-5day', name: 'PHAT', author: 'Layne Norton', focus: 'hypertrophy', level: 'intermediate', perWeek: 5,
    summary: 'Dos días de fuerza más tres de hipertrofia de alto volumen. 5 días.',
    howTo: 'Los días de fuerza trabajan los básicos en 3–5 repeticiones; los de hipertrofia repiten los patrones con menos carga en 8–20 repeticiones.',
    days: [
      { name: 'Torso · Fuerza', weekday: 0, exercises: [
        x('barbell-row', 4, 3, 5, 1, 180), x('lat-pulldown', 3, 6, 8, 2, 150, PULLUP), x('bench-press', 4, 3, 5, 1, 180),
        x('overhead-press', 3, 6, 8, 2, 150), x('barbell-curl', 3, 6, 10, 1, 60), x('skull-crusher', 3, 6, 10, 1, 60)] },
      { name: 'Pierna · Fuerza', weekday: 1, exercises: [
        x('back-squat', 4, 3, 5, 1, 240), x('deadlift', 4, 3, 5, 1, 240), x('leg-press', 3, 8, 10, 2, 120),
        x('leg-curl', 3, 6, 10, 1, 60), x('standing-calf-raise', 4, 6, 10, 1, 60)] },
      { name: 'Espalda / Hombros · Hipertrofia', weekday: 3, exercises: [
        x('machine-row', 4, 8, 12, 1, 120, CABLE_ROW), x('lat-pulldown', 3, 12, 15, 1, 90), x('overhead-press', 3, 8, 12, 1, 90),
        x('lateral-raise', 4, 12, 20, 1, 60), x('rear-delt-fly', 3, 15, 20, 1, 60)] },
      { name: 'Pierna · Hipertrofia', weekday: 4, exercises: [
        x('front-squat', 4, 8, 12, 1, 150), x('romanian-deadlift', 3, 8, 12, 1, 120), x('leg-extension', 4, 12, 20, 1, 60),
        x('leg-curl', 3, 12, 15, 1, 60), x('seated-calf-raise', 4, 12, 20, 1, 60)] },
      { name: 'Pecho / Brazos · Hipertrofia', weekday: 5, exercises: [
        x('incline-db-press', 4, 8, 12, 1, 120), x('pec-deck', 3, 12, 15, 1, 60, CABLE_FLY), x('hammer-curl', 4, 10, 15, 1, 60),
        x('machine-curl', 3, 12, 15, 1, 60, CABLE_CURL), x('overhead-db-extension', 4, 10, 15, 1, 60),
        x('machine-triceps-extension', 3, 12, 15, 1, 60, PUSHDOWN)] },
    ],
  },
  {
    id: 'full-body-3day', name: 'Cuerpo completo 3×semana', author: null, focus: 'general', level: 'beginner', perWeek: 3,
    summary: 'Programa de cuerpo completo para principiantes con volumen moderado. 3 días no consecutivos.',
    howTo: 'Cada sesión cubre sentadilla, bisagra o tirón, empuje y un accesorio en 6–15 repeticiones. Sube la carga al llegar al tope del rango en todas las series.',
    days: [
      { name: 'Cuerpo completo A', weekday: 0, exercises: [
        x('back-squat', 3, 6, 10, 2, 180), x('bench-press', 3, 6, 10, 2, 150), x('barbell-row', 3, 8, 12, 2, 120), x('lateral-raise', 3, 12, 15, 1, 60)] },
      { name: 'Cuerpo completo B', weekday: 2, exercises: [
        x('deadlift', 3, 5, 8, 2, 180), x('overhead-press', 3, 6, 10, 2, 150), x('lat-pulldown', 3, 8, 12, 2, 120), x('leg-curl', 3, 10, 15, 1, 60)] },
      { name: 'Cuerpo completo C', weekday: 4, exercises: [
        x('front-squat', 3, 6, 10, 2, 180), x('incline-db-press', 3, 8, 12, 2, 120), x('machine-row', 3, 8, 12, 2, 120, CABLE_ROW),
        x('barbell-curl', 3, 10, 15, 1, 60)] },
    ],
  },
];

export const programById = (id: string) => programs.find((program) => program.id === id);


export type ProgramFit = { ok: true; plan: Plan } | { ok: false; missing: string[] };

// Aplica un programa al equipo y las lesiones declaradas. Para no desfigurar un
// programa probado, se sustituye a lo más 1 ejercicio por cada 5 en un día; si
// hace falta más, el programa no es compatible con el equipo.
export function planFromProgram(program: Program, input: PlanInput): ProgramFit {
  const has = owns(input.equipment);
  const changes: PlanChange[] = [];
  const missing = new Set<string>();
  const days = program.days.map((day, dayIndex) => {
    const lacking = day.exercises.filter((item) => !has(exerciseById(item.exerciseId)!));
    if (lacking.length > substitutionCeiling(day.exercises.length)) lacking.forEach((item) => missing.add(item.exerciseId));
    const exercises: PlannedExercise[] = [];
    for (const item of day.exercises) {
      const exercise = exerciseById(item.exerciseId)!;
      const { rir: _rir, ...planned } = item;
      if (!has(exercise)) {
        const taken = new Set([...exercises, ...day.exercises].map((other) => other.exerciseId));
        const replacement = exercise.substitutes.map((id) => exerciseById(id)!)
          .find((option) => has(option) && !taken.has(option.id) && !contraindicated(option, input.zones));
        if (!replacement) { changes.push({ day: dayIndex, exerciseId: exercise.id, action: 'removed', reason: 'equipment' }); continue; }
        changes.push({ day: dayIndex, exerciseId: exercise.id, action: 'substituted', reason: 'equipment', replacementId: replacement.id });
        exercises.push({ ...planned, exerciseId: replacement.id });
        continue;
      }
      if (contraindicated(exercise, input.zones)) { changes.push({ day: dayIndex, exerciseId: exercise.id, action: 'removed', reason: 'injury' }); continue; }
      exercises.push(planned);
    }
    return { name: day.name, weekday: day.weekday, exercises };
  });
  if (missing.size) return { ok: false, missing: [...missing] };
  const warnings: Plan['warnings'] = [];
  if (input.zones.length) warnings.push('injury-review');
  if (days.some((day) => day.exercises.length < 3)) warnings.push('short-session');
  return { ok: true, plan: {
    ruleVersion: PROGRAMS_VERSION, catalogVersion: CATALOG_VERSION, templateId: program.id, templateVersion: PROGRAMS_VERSION,
    environment: input.environment, input: { ...input, days: program.days.length }, days, changes, warnings,
  } };
}
