import { contraindicated, estimateLoad, exerciseById, overloadSuggestion, type Measure, type Zone } from '@strongerfit/training-engine';
import type { TimerSpec } from './timers';

export type PerformedSet = {
  id: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  // Serie de calibración: la persona elige la carga y declara las repeticiones en reserva (RF-32).
  calibration?: boolean;
  reserve?: number;
  // Carga estimada desde la calibración; se rotula como tal hasta que la persona la confirma.
  estimated?: boolean;
};

export type SessionExercise = {
  id: string;
  exerciseId?: string;
  timer?: TimerSpec;
  tempo?: [number, number, number];
  name: string;
  muscleGroup: string;
  restSeconds: number;
  measure?: Measure;
  repsMax?: number;
  loadStep?: number;
  technique: string[];
  history: { label: string; weightKg: number; reps: number; sets: number }[];
  sets: PerformedSet[];
};

export type SessionTemplate = {
  title: string;
  elapsedSeconds: number;
  initialRestSeconds: number;
  exercises: SessionExercise[];
};

export type SessionState = {
  title: string;
  exercises: SessionExercise[];
  exerciseIndex: number;
  status: 'active' | 'paused' | 'finished';
  elapsedMs: number;
  runningSinceMs: number | null;
  rest: { endsAtMs: number | null; pausedRemainingMs: number; durationMs: number };
};

export type SessionAction =
  | { type: 'toggle-pause'; now: number }
  | { type: 'complete-set'; exerciseId: string; setId: number; weightKg: number; reps: number; reserve?: number; now: number }
  | { type: 'add-set' }
  | { type: 'add-rest'; now: number }
  | { type: 'skip-rest' }
  | { type: 'next-exercise' }
  | { type: 'finish'; now: number };

const emptyRest = () => ({ endsAtMs: null, pausedRemainingMs: 0, durationMs: 0 });

export function createSession(template: SessionTemplate, now: number): SessionState {
  if (!template.exercises.length || template.exercises.some((exercise) => !exercise.sets.length)) {
    throw new Error('Una sesión requiere ejercicios con series.');
  }
  return {
    title: template.title,
    exercises: template.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ ...set })) })),
    exerciseIndex: 0,
    status: 'active',
    elapsedMs: template.elapsedSeconds * 1000,
    runningSinceMs: now,
    rest: template.initialRestSeconds > 0
      ? { endsAtMs: now + template.initialRestSeconds * 1000, pausedRemainingMs: 0,
        durationMs: template.exercises[0]!.restSeconds * 1000 }
      : emptyRest(),
  };
}

export function currentExercise(state: SessionState): SessionExercise {
  return state.exercises[state.exerciseIndex]!;
}

export function activeSet(exercise: SessionExercise): PerformedSet | undefined {
  return exercise.sets.find((set) => !set.completed);
}

export function elapsedMs(state: SessionState, now: number): number {
  return state.elapsedMs + (state.runningSinceMs === null ? 0 : Math.max(0, now - state.runningSinceMs));
}

export function restRemainingMs(state: SessionState, now: number): number {
  return state.rest.endsAtMs === null ? state.rest.pausedRemainingMs : Math.max(0, state.rest.endsAtMs - now);
}

export function parseSetInput(weight: string, repetitions: string): { weightKg: number; reps: number } | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(weight.trim()) || !/^\d+$/.test(repetitions.trim())) return null;
  const weightKg = Number(weight.trim().replace(',', '.'));
  const reps = Number(repetitions.trim());
  return Number.isFinite(weightKg) && weightKg >= 0 && Number.isSafeInteger(reps) && reps > 0 ? { weightKg, reps } : null;
}

export function sessionSummary(state: SessionState) {
  const sets = state.exercises.flatMap((exercise) => exercise.sets);
  const completed = sets.filter((set) => set.completed);
  return {
    completedSets: completed.length,
    totalSets: sets.length,
    volumeKg: completed.reduce((total, set) => total + set.weightKg * set.reps, 0),
  };
}

// Registro histórico de una sesión finalizada; null si no se completó ninguna serie.
// Series completadas por ejercicio del catálogo; los ejercicios de ejemplo sin id se omiten.
export function sessionLogs(state: SessionState) {
  return state.exercises.flatMap((exercise) => {
    const sets = exercise.sets.filter((set) => set.completed).map(({ weightKg, reps }) => ({ weightKg, reps }));
    return exercise.exerciseId && sets.length ? [{ exerciseId: exercise.exerciseId, sets }] : [];
  });
}

export function sessionRecord(state: SessionState, meta: { id: string; date: string; time: string }) {
  const summary = sessionSummary(state);
  if (state.status !== 'finished' || summary.completedSets === 0) return null;
  const exercises = sessionLogs(state);
  return { ...meta, name: state.title, durationMinutes: Math.max(1, Math.round(state.elapsedMs / 60_000)),
    volumeKg: summary.volumeKg, status: 'completed' as const, exercises };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (state.status === 'finished') return state;
  const exercise = currentExercise(state);

  switch (action.type) {
    case 'toggle-pause': {
      if (state.status === 'active') {
        return { ...state, status: 'paused', elapsedMs: elapsedMs(state, action.now), runningSinceMs: null,
          rest: { ...state.rest, pausedRemainingMs: restRemainingMs(state, action.now), endsAtMs: null } };
      }
      return { ...state, status: 'active', runningSinceMs: action.now,
        rest: { ...state.rest, endsAtMs: state.rest.pausedRemainingMs > 0 ? action.now + state.rest.pausedRemainingMs : null,
          pausedRemainingMs: 0 } };
    }
    case 'complete-set': {
      const set = activeSet(exercise);
      if (state.status !== 'active' || action.exerciseId !== exercise.id || set?.id !== action.setId
        || !Number.isFinite(action.weightKg) || action.weightKg < 0 || !Number.isSafeInteger(action.reps) || action.reps < 1) return state;
      // Tras la calibración se estiman una sola vez las series pendientes (BR-22, BR-23).
      const calibration = set.calibration && action.weightKg > 0
        ? { weightKg: action.weightKg, reps: action.reps, reserve: action.reserve ?? 0 } : null;
      return { ...state,
        exercises: state.exercises.map((item, index) => index === state.exerciseIndex ? {
          ...item, sets: item.sets.map((row) => {
            if (row.id === action.setId) {
              const { estimated: _estimated, ...done } = row;
              return { ...done, weightKg: action.weightKg, reps: action.reps, completed: true, ...(row.calibration ? { reserve: action.reserve ?? 0 } : {}) };
            }
            return calibration && !row.completed
              ? { ...row, weightKg: estimateLoad(calibration, row.reps, item.loadStep ?? 2.5), estimated: true } : row;
          }),
        } : item),
        rest: { endsAtMs: action.now + exercise.restSeconds * 1000, pausedRemainingMs: 0, durationMs: exercise.restSeconds * 1000 },
      };
    }
    case 'add-set': {
      if (state.status !== 'active') return state;
      const last = exercise.sets[exercise.sets.length - 1]!;
      const nextId = Math.max(...exercise.sets.map((set) => set.id)) + 1;
      return { ...state, exercises: state.exercises.map((item, index) => index === state.exerciseIndex
        ? { ...item, sets: [...item.sets, { id: nextId, weightKg: last.weightKg, reps: last.reps, completed: false, ...(last.estimated ? { estimated: true } : {}) }] } : item) };
    }
    case 'add-rest': {
      const remaining = restRemainingMs(state, action.now);
      return { ...state, rest: {
        endsAtMs: state.status === 'active' ? action.now + remaining + 30_000 : null,
        pausedRemainingMs: state.status === 'paused' ? remaining + 30_000 : 0,
        durationMs: remaining > 0 ? state.rest.durationMs + 30_000 : 30_000,
      } };
    }
    case 'skip-rest': return { ...state, rest: emptyRest() };
    case 'next-exercise':
      return state.status === 'active' && state.exerciseIndex < state.exercises.length - 1
        ? { ...state, exerciseIndex: state.exerciseIndex + 1, rest: emptyRest() } : state;
    case 'finish':
      return { ...state, status: 'finished', elapsedMs: elapsedMs(state, action.now), runningSinceMs: null, rest: emptyRest() };
  }
}

// Sugerencias de sobrecarga al terminar (RF-33, BR-24): solo ejercicios con carga, con todas sus series
// completadas en el máximo del rango y sin zona con lesión declarada.
export function overloadSuggestions(state: SessionState, zones: Zone[]) {
  return state.exercises.flatMap((exercise) => {
    const catalogExercise = exercise.exerciseId ? exerciseById(exercise.exerciseId) : undefined;
    if (!catalogExercise || exercise.measure !== 'weighted-reps' || !exercise.repsMax || contraindicated(catalogExercise, zones)) return [];
    if (exercise.sets.some((set) => !set.completed)) return [];
    const step = exercise.loadStep ?? 2.5;
    const suggestedKg = overloadSuggestion(exercise.sets, exercise.repsMax, step);
    if (suggestedKg === null) return [];
    return [{ exerciseId: catalogExercise.id, name: exercise.name, currentKg: Math.min(...exercise.sets.map((set) => set.weightKg)), suggestedKg, step }];
  });
}
