import {
  estimatedMinutes,
  exerciseById,
  generatePlan,
  planFromProgram,
  programs,
  type Exercise,
  type Plan,
  type PlanInput,
  type PlannedExercise,
  type Program,
} from '@strongerfit/training-engine';
import {
  labels,
  type FocusMuscle,
  type Goal,
  type PreferredSplit,
  type RoutinePreferences,
  type TrainingStyle,
} from '../../onboarding/domain/onboarding';

export type RoutineSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  source: 'personalized' | 'classic';
  programId?: string;
  splitLabel: string;
  matchScore: number;
  matchReasons: string[];
  daysCount: number;
  estimatedMinutes: number;
  plan: Plan;
};

const SPLIT_DAYS: Record<Exclude<PreferredSplit, 'auto'>, number> = {
  'full-body': 3,
  'upper-lower': 4,
  'push-pull-legs': 5,
};

const SPLIT_NAMES: Record<Exclude<PreferredSplit, 'auto'>, string> = {
  'full-body': 'Cuerpo completo',
  'upper-lower': 'Torso / Pierna',
  'push-pull-legs': 'Empuje / Tirón / Pierna',
};

function matchesFocusMuscle(exercise: Exercise, focus: FocusMuscle): boolean {
  const group = exercise.muscleGroup.toLowerCase();
  switch (focus) {
    case 'legs-glutes':
      return exercise.pattern === 'squat' || exercise.pattern === 'hinge' || exercise.pattern === 'lunge'
        || group.includes('pierna') || group.includes('glúteo') || group.includes('cuádriceps') || group.includes('isquio');
    case 'chest-push':
      return exercise.pattern === 'push-h' || exercise.pattern === 'push-v'
        || group.includes('pecho') || group.includes('hombro');
    case 'back-pull':
      return exercise.pattern === 'pull-h' || exercise.pattern === 'pull-v'
        || group.includes('espalda') || group.includes('dorsal');
    case 'arms':
      return group.includes('bíceps') || group.includes('tríceps') || group.includes('brazo');
    case 'core':
      return exercise.pattern === 'core' || group.includes('core') || group.includes('abdomen');
  }
}

function applyStyleToExercise(item: PlannedExercise, exercise: Exercise, style: TrainingStyle): PlannedExercise {
  if (style === 'balanced' || exercise.kind === 'isometric') return item;
  if (style === 'strength-heavy') {
    if (exercise.kind === 'compound') return { ...item, sets: Math.min(4, Math.max(item.sets, 4)), repsMin: 4, repsMax: 6, restSeconds: Math.max(item.restSeconds, 150) };
    return { ...item, repsMin: 8, repsMax: 10, restSeconds: Math.max(item.restSeconds, 75) };
  }
  if (style === 'hypertrophy') {
    if (exercise.kind === 'compound') return { ...item, sets: Math.min(4, item.sets), repsMin: 8, repsMax: 12, restSeconds: Math.min(120, Math.max(item.restSeconds, 90)) };
    return { ...item, sets: Math.min(3, item.sets), repsMin: 10, repsMax: 15, restSeconds: 60 };
  }
  // metabolic
  if (exercise.kind === 'compound') return { ...item, repsMin: 12, repsMax: 15, restSeconds: 60 };
  return { ...item, repsMin: 15, repsMax: 20, restSeconds: 45 };
}

function customizePlan(plan: Plan, prefs: RoutinePreferences): Plan {
  const days = plan.days.map((day) => {
    const exercises = day.exercises.map((item, idx) => {
      const exercise = exerciseById(item.exerciseId);
      if (!exercise) return item;
      let next = applyStyleToExercise(item, exercise, prefs.trainingStyle);
      const isFocused = prefs.focusMuscles.some((focus) => matchesFocusMuscle(exercise, focus));
      if (isFocused && next.sets < 4) {
        next = {
          ...next,
          sets: next.sets + 1,
          note: next.note ? `${next.note} · Prioridad muscular` : 'Prioridad muscular',
        };
      }
      if (idx === 0 && prefs.cardioPreference === 'warmup') {
        const warmupNote = 'Inicio: 5–8 min de movilidad y activación';
        next = { ...next, note: next.note ? `${warmupNote} · ${next.note}` : warmupNote };
      }
      if (idx === day.exercises.length - 1 && prefs.cardioPreference === 'finisher') {
        const finisherNote = 'Al finalizar: 10–12 min de cardio moderado';
        next = { ...next, note: next.note ? `${next.note} · ${finisherNote}` : finisherNote };
      }
      return next;
    });
    return { ...day, exercises };
  });
  return { ...plan, days };
}

function averageMinutes(plan: Plan): number {
  if (!plan.days.length) return 0;
  const total = plan.days.reduce((sum, day) => sum + estimatedMinutes(day.exercises), 0);
  return Math.round(total / plan.days.length);
}

function splitForProgram(program: Program): Exclude<PreferredSplit, 'auto'> {
  if (program.id.includes('upper-lower') || program.id.includes('phul')) return 'upper-lower';
  if (program.id.includes('ppl')) return 'push-pull-legs';
  return 'full-body';
}

function effectiveSplitForDays(days: number): Exclude<PreferredSplit, 'auto'> {
  if (days <= 3) return 'full-body';
  if (days === 4) return 'upper-lower';
  return 'push-pull-legs';
}

function buildPersonalizedSuggestion(
  input: PlanInput,
  goal: Goal,
  prefs: RoutinePreferences,
  overrideSplit?: Exclude<PreferredSplit, 'auto'>,
): RoutineSuggestion {
  const targetSplit = overrideSplit ?? (prefs.preferredSplit === 'auto' ? effectiveSplitForDays(input.days) : prefs.preferredSplit);
  const targetDays = overrideSplit ? SPLIT_DAYS[overrideSplit] : (prefs.preferredSplit === 'auto' ? input.days : SPLIT_DAYS[prefs.preferredSplit]);
  const rawPlan = generatePlan({ ...input, days: targetDays });
  const plan = customizePlan(rawPlan, prefs);

  const reasons: string[] = [];
  if (rawPlan.days.length === input.days) reasons.push(`Calza con tus ${input.days} días por semana`);
  else reasons.push(`Estructura de ${rawPlan.days.length} días (${SPLIT_NAMES[targetSplit]})`);

  if (prefs.trainingStyle !== 'balanced') reasons.push(`Estilo: ${labels.trainingStyle[prefs.trainingStyle]}`);
  else reasons.push(`Enfoque en ${labels.goal[goal].toLowerCase()}`);

  if (prefs.focusMuscles.length > 0) {
    reasons.push(`Prioriza ${prefs.focusMuscles.map((m) => labels.focusMuscles[m].toLowerCase()).join(', ')}`);
  }
  if (prefs.cardioPreference === 'finisher') reasons.push('Incluye cardio final de 10–12 min');
  else if (prefs.cardioPreference === 'warmup') reasons.push('Incluye activación inicial');
  if (input.zones.length > 0) reasons.push('Adaptada a tus zonas con molestia');

  const splitMatchesPreference = prefs.preferredSplit === 'auto' || prefs.preferredSplit === targetSplit;
  const daysDelta = Math.abs(rawPlan.days.length - input.days);
  const matchScore = Math.max(72, Math.min(99, 96 - daysDelta * 5 - (splitMatchesPreference ? 0 : 6)));

  const styleTitle = prefs.trainingStyle === 'balanced' ? labels.goal[goal] : labels.trainingStyle[prefs.trainingStyle].split(' (')[0];
  return {
    id: `personalized-${targetSplit}-${rawPlan.days.length}d`,
    title: `${SPLIT_NAMES[targetSplit]} · ${styleTitle}`,
    subtitle: `Plan adaptado a tu equipo (${labels.environment[input.environment].toLowerCase()}) y tiempo disponible.`,
    source: 'personalized',
    splitLabel: SPLIT_NAMES[targetSplit],
    matchScore,
    matchReasons: reasons.slice(0, 4),
    daysCount: rawPlan.days.length,
    estimatedMinutes: averageMinutes(plan),
    plan,
  };
}

function scoreProgram(program: Program, input: PlanInput, goal: Goal, prefs: RoutinePreferences, changesCount: number): { score: number; reasons: string[] } {
  let score = 55;
  const reasons: string[] = [];

  const goalFocusMatch =
    (goal === 'strength' && program.focus === 'strength')
    || (goal === 'muscle' && program.focus === 'hypertrophy')
    || ((goal === 'fat-loss' || goal === 'health') && program.focus === 'general');
  if (goalFocusMatch) {
    score += 16;
    reasons.push(`Alineado con ${labels.goal[goal].toLowerCase()}`);
  } else if (
    (prefs.trainingStyle === 'strength-heavy' && program.focus === 'strength')
    || (prefs.trainingStyle === 'hypertrophy' && program.focus === 'hypertrophy')
  ) {
    score += 12;
    const styleName = (labels.trainingStyle[prefs.trainingStyle].split(' (')[0] ?? '').toLowerCase();
    reasons.push(`Enfoque en ${styleName}`);
  }

  const daysDiff = Math.abs(program.perWeek - input.days);
  if (daysDiff === 0) {
    score += 16;
    reasons.push(`Exactamente ${program.perWeek} días/semana`);
  } else if (daysDiff === 1) {
    score += 8;
    reasons.push(`${program.perWeek} días/semana (cercano a tu meta)`);
  }

  if (program.level === input.level || (input.level === 'advanced' && program.level === 'intermediate')) {
    score += 10;
    reasons.push(`Nivel ${labels.level[program.level].toLowerCase()}`);
  }

  const programSplit = splitForProgram(program);
  if (prefs.preferredSplit !== 'auto' && prefs.preferredSplit === programSplit) {
    score += 8;
    reasons.push(`División ${SPLIT_NAMES[programSplit]}`);
  }

  if (changesCount === 0) {
    score += 3;
    reasons.push('100% compatible con tu equipo');
  } else {
    reasons.push(`Adaptado con ${changesCount} ${changesCount === 1 ? 'ajuste' : 'ajustes'} de equipo/lesión`);
  }

  return { score: Math.min(97, score), reasons: reasons.slice(0, 4) };
}

export function suggestRoutines(input: PlanInput, goal: Goal, prefs: RoutinePreferences): RoutineSuggestion[] {
  const suggestions: RoutineSuggestion[] = [];

  // 1. Sugerencia principal personalizada según preferencias exactas.
  const primary = buildPersonalizedSuggestion(input, goal, prefs);
  suggestions.push(primary);

  // 2. Si el usuario eligió una división distinta a la de sus días, ofrecer también la de sus días exactos.
  if (prefs.preferredSplit !== 'auto' && SPLIT_DAYS[prefs.preferredSplit] !== input.days) {
    suggestions.push(buildPersonalizedSuggestion(input, goal, prefs, effectiveSplitForDays(input.days)));
  }

  // 3. Programas clásicos compatibles con el equipo y lesiones del usuario.
  const classicSuggestions: RoutineSuggestion[] = [];
  for (const program of programs) {
    const fit = planFromProgram(program, input);
    if (!fit.ok) continue;
    const plan = customizePlan(fit.plan, { ...prefs, trainingStyle: 'balanced', focusMuscles: [] });
    const { score, reasons } = scoreProgram(program, input, goal, prefs, fit.plan.changes.length);
    classicSuggestions.push({
      id: `classic-${program.id}`,
      title: program.name,
      subtitle: program.summary,
      source: 'classic',
      programId: program.id,
      splitLabel: SPLIT_NAMES[splitForProgram(program)],
      matchScore: score,
      matchReasons: reasons,
      daysCount: program.perWeek,
      estimatedMinutes: averageMinutes(plan),
      plan,
    });
  }

  classicSuggestions.sort((a, b) => b.matchScore - a.matchScore);
  return [...suggestions, ...classicSuggestions.slice(0, 4)].sort((a, b) => b.matchScore - a.matchScore);
}
