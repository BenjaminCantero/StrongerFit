import { contraindicated, exerciseById, owns, substitutionCeiling } from './rules';
import { catalog, CATALOG_VERSION, type Difficulty, type Equipment, type Exercise, type Zone } from './catalog';
import {
  environmentEquipment, prescriptions, selectTemplate, TEMPLATE_VERSION, weekdays, type Environment, type TemplateLevel,
} from './templates';

export * from './catalog';
export * from './technique';
export * from './loads';
export * from './templates';
export * from './programs';
export const RULE_VERSION = 'entrenamiento-0.2';

export type Level = Difficulty;

export type PlanInput = { days: number; minutes: number; environment: Environment; equipment: Equipment[]; level: Level; zones: Zone[] };
// tempo: segundos de bajada, pausa y subida (tiempo bajo tensión, SRS 8.9).
// note: indicación del programa de origen (p. ej. esquema 5/3/1); se conserva al editar.
export type PlannedExercise = { exerciseId: string; sets: number; repsMin: number; repsMax: number; restSeconds: number; tempo?: [number, number, number]; note?: string };
export type PlanDay = { name: string; weekday: number; exercises: PlannedExercise[] };
// Cambios respecto de la plantilla, con su motivo, para mostrarlos al usuario (SRS 8.12, paso 7).
export type PlanChange = { day: number; exerciseId: string; action: 'substituted' | 'removed'; reason: 'equipment' | 'injury' | 'time'; replacementId?: string };
export type PlanWarning = 'injury-review' | 'frequency-adjusted' | 'level-adjusted' | 'environment-fallback' | 'short-session';
export type Plan = {
  ruleVersion: string; catalogVersion: string; templateId: string; templateVersion: string; environment: Environment;
  input: PlanInput; days: PlanDay[]; changes: PlanChange[]; warnings: PlanWarning[];
};

export { contraindicated, exerciseById, substitutionCeiling } from './rules';

// BR-03: solo ejercicios cuyo equipo está disponible. Peso corporal siempre lo está.
export function available(equipment: Equipment[]) {
  return catalog.filter(owns(equipment));
}


// Adapta un día de plantilla en el orden de SRS 8.12: equipo, techo, lesiones y revalidación.
export function adaptDay(exerciseIds: string[], equipment: Equipment[], zones: Zone[]) {
  const has = owns(equipment);
  const exercises = exerciseIds.map((id) => exerciseById(id)!);
  const missing = exercises.filter((exercise) => !has(exercise));
  if (missing.length > substitutionCeiling(exercises.length)) return { ok: false as const, missing: missing.map((exercise) => exercise.id) };

  const changes: Omit<PlanChange, 'day'>[] = [];
  const kept: Exercise[] = [];
  for (const exercise of exercises) {
    if (has(exercise)) { kept.push(exercise); continue; }
    const taken = new Set([...kept, ...exercises].map((item) => item.id));
    const replacement = exercise.substitutes.map((id) => exerciseById(id)!)
      .find((option) => has(option) && !taken.has(option.id) && !contraindicated(option, zones));
    if (replacement) { kept.push(replacement); changes.push({ exerciseId: exercise.id, action: 'substituted', reason: 'equipment', replacementId: replacement.id }); }
    else changes.push({ exerciseId: exercise.id, action: 'removed', reason: 'equipment' });
  }
  // Lesiones: se eliminan sin reemplazo; la revalidación cubre también a los sustitutos.
  const result = kept.filter((exercise) => {
    if (!contraindicated(exercise, zones)) return true;
    changes.push({ exerciseId: exercise.id, action: 'removed', reason: 'injury' });
    return false;
  });
  return { ok: true as const, exerciseIds: result.map((exercise) => exercise.id), changes };
}

// Entorno de mayor equipamiento cuyo equipo completo está disponible.
function fallbackEnvironment(equipment: Equipment[]): Environment {
  const owned = new Set<Equipment>([...equipment, 'bodyweight']);
  return (['commercial-gym', 'small-gym', 'calisthenics', 'none'] as const)
    .find((environment) => environmentEquipment[environment].every((item) => owned.has(item))) ?? 'none';
}

export const estimatedMinutes = (exercises: PlannedExercise[]) =>
  Math.round(exercises.reduce((total, item) => total + item.sets * (45 + item.restSeconds), 0) / 60);

function prescribe(exerciseId: string, level: TemplateLevel): PlannedExercise {
  const { sets, reps, rest } = prescriptions[level][exerciseById(exerciseId)!.kind];
  return { exerciseId, sets, repsMin: reps[0], repsMax: reps[1], restSeconds: rest };
}

export function generatePlan(input: PlanInput): Plan {
  const level: TemplateLevel = input.level === 'beginner' ? 'beginner' : 'intermediate';
  const warnings: PlanWarning[] = [];
  let environment = input.environment;
  let template = selectTemplate(environment, level, input.days);
  let adapted = template.plan.map((day) => adaptDay(day.exerciseIds, input.equipment, input.zones));
  // Si alguna sesión supera el techo de sustituciones, se usa la plantilla del entorno que sí cubre el equipo.
  if (adapted.some((day) => !day.ok)) {
    environment = fallbackEnvironment(input.equipment);
    template = selectTemplate(environment, level, input.days);
    adapted = template.plan.map((day) => adaptDay(day.exerciseIds, input.equipment, input.zones));
    warnings.push('environment-fallback');
  }

  const changes: PlanChange[] = [];
  const days = template.plan.map((day, dayIndex) => {
    const result = adapted[dayIndex]!;
    if (!result.ok) return { name: day.name, weekday: weekdays[template.days][dayIndex]!, exercises: [] };
    changes.push(...result.changes.map((change) => ({ ...change, day: dayIndex })));
    const exercises = result.exerciseIds.map((id) => prescribe(id, level));
    // Ajuste a la duración declarada: se quitan los últimos ejercicios sin bajar de 3.
    while (exercises.length > 3 && estimatedMinutes(exercises) > input.minutes) {
      changes.push({ day: dayIndex, exerciseId: exercises.pop()!.exerciseId, action: 'removed', reason: 'time' });
    }
    return { name: day.name, weekday: weekdays[template.days][dayIndex]!, exercises };
  });

  if (input.zones.length) warnings.push('injury-review');
  if (template.days !== input.days) warnings.push('frequency-adjusted');
  if (input.level === 'advanced') warnings.push('level-adjusted');
  if (days.some((day) => day.exercises.length < 3)) warnings.push('short-session');
  return { ruleVersion: RULE_VERSION, catalogVersion: CATALOG_VERSION, templateId: template.id, templateVersion: TEMPLATE_VERSION, environment,
    input, days, changes, warnings };
}

// CA-12: ediciones dentro de rangos coherentes, sin equipo no declarado ni zonas contraindicadas.
export function validateExercise(item: PlannedExercise, equipment: Equipment[], zones: Zone[] = []): string | null {
  const exercise = exerciseById(item.exerciseId);
  if (!exercise) return 'El ejercicio no existe en el catálogo.';
  if (!owns(equipment)(exercise)) return 'Requiere equipamiento que no declaraste.';
  if (contraindicated(exercise, zones)) return 'Está contraindicado para una zona con lesión que declaraste.';
  if (!Number.isInteger(item.sets) || item.sets < 1 || item.sets > 6) return 'Usa entre 1 y 6 series.';
  if (!Number.isInteger(item.repsMin) || !Number.isInteger(item.repsMax) || item.repsMin < 1 || item.repsMax > 60 || item.repsMin > item.repsMax) {
    return 'Usa un rango de repeticiones entre 1 y 60.';
  }
  if (!Number.isInteger(item.restSeconds) || item.restSeconds < 15 || item.restSeconds > 300) return 'Usa un descanso entre 15 y 300 segundos.';
  return null;
}

export function swapOptions(item: PlannedExercise, equipment: Equipment[], zones: Zone[] = []) {
  const current = exerciseById(item.exerciseId);
  if (!current) return [];
  return current.substitutes.map((id) => exerciseById(id)!).filter((exercise) => owns(equipment)(exercise) && !contraindicated(exercise, zones));
}
