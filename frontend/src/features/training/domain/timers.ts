// Temporizadores por ejercicio (RF-25). El tiempo se calcula por diferencia con
// una marca absoluta, así sigue siendo correcto tras pasar a segundo plano (RNF-26).
export type TimerSpec =
  | { kind: 'hold'; seconds: number }
  | { kind: 'interval'; workSeconds: number; restSeconds: number; rounds: number };

export type TimerRun = { spec: TimerSpec; startedAtMs: number | null; accumulatedMs: number };
export type TimerPhase = { phase: 'hold' | 'work' | 'rest' | 'done'; round: number; remainingMs: number; totalRemainingMs: number };

export const defaultInterval: TimerSpec = { kind: 'interval', workSeconds: 40, restSeconds: 20, rounds: 8 };

export function totalMs(spec: TimerSpec): number {
  return spec.kind === 'hold' ? spec.seconds * 1000
    : (spec.rounds * spec.workSeconds + (spec.rounds - 1) * spec.restSeconds) * 1000;
}

export const startTimer = (spec: TimerSpec, now: number): TimerRun => ({ spec, startedAtMs: now, accumulatedMs: 0 });
export const elapsed = (run: TimerRun, now: number) => run.accumulatedMs + (run.startedAtMs === null ? 0 : Math.max(0, now - run.startedAtMs));
export const pauseTimer = (run: TimerRun, now: number): TimerRun => ({ ...run, accumulatedMs: elapsed(run, now), startedAtMs: null });
export const resumeTimer = (run: TimerRun, now: number): TimerRun => run.startedAtMs === null ? { ...run, startedAtMs: now } : run;

export function timerPhase(run: TimerRun, now: number): TimerPhase {
  const spent = Math.min(elapsed(run, now), totalMs(run.spec));
  const totalRemainingMs = totalMs(run.spec) - spent;
  const { spec } = run;
  if (totalRemainingMs <= 0) return { phase: 'done', round: spec.kind === 'interval' ? spec.rounds : 1, remainingMs: 0, totalRemainingMs: 0 };
  if (spec.kind === 'hold') return { phase: 'hold', round: 1, remainingMs: totalRemainingMs, totalRemainingMs };
  const cycle = (spec.workSeconds + spec.restSeconds) * 1000;
  const round = Math.floor(spent / cycle) + 1;
  const inCycle = spent % cycle;
  const work = spec.workSeconds * 1000;
  return inCycle < work
    ? { phase: 'work', round, remainingMs: work - inCycle, totalRemainingMs }
    : { phase: 'rest', round, remainingMs: cycle - inCycle, totalRemainingMs };
}

// Milisegundos hasta el aviso final, o null si está en pausa o terminado.
export function endsInMs(run: TimerRun, now: number): number | null {
  const remaining = totalMs(run.spec) - elapsed(run, now);
  return run.startedAtMs === null || remaining <= 0 ? null : remaining;
}

export function validInterval(work: number, rest: number, rounds: number): string | null {
  if (![work, rest, rounds].every(Number.isInteger)) return 'Usa números enteros.';
  if (work < 5 || work > 600) return 'El trabajo debe durar entre 5 y 600 segundos.';
  if (rest < 0 || rest > 600) return 'El descanso debe durar entre 0 y 600 segundos.';
  if (rounds < 1 || rounds > 50) return 'Usa entre 1 y 50 rondas.';
  return null;
}
