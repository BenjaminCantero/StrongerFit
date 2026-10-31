import { describe, expect, it } from 'vitest';
import { defaultInterval, endsInMs, pauseTimer, resumeTimer, startTimer, timerPhase, totalMs, validInterval } from './timers';

describe('temporizadores por ejercicio', () => {
  it('un temporizador de 90 s sigue correcto tras 120 s en segundo plano (CA-20)', () => {
    const run = startTimer({ kind: 'hold', seconds: 90 }, 0);
    expect(endsInMs(run, 0)).toBe(90_000);
    expect(timerPhase(run, 60_000)).toMatchObject({ phase: 'hold', remainingMs: 30_000 });
    expect(timerPhase(run, 120_000)).toMatchObject({ phase: 'done', remainingMs: 0 });
    expect(endsInMs(run, 120_000)).toBeNull();
  });

  it('recorre trabajo y descanso por ronda, sin descanso tras la última', () => {
    const run = startTimer(defaultInterval, 0);
    expect(totalMs(defaultInterval)).toBe((8 * 40 + 7 * 20) * 1000);
    expect(timerPhase(run, 10_000)).toMatchObject({ phase: 'work', round: 1, remainingMs: 30_000 });
    expect(timerPhase(run, 45_000)).toMatchObject({ phase: 'rest', round: 1, remainingMs: 15_000 });
    expect(timerPhase(run, 60_000)).toMatchObject({ phase: 'work', round: 2 });
    expect(timerPhase(run, 7 * 60_000 + 10_000)).toMatchObject({ phase: 'work', round: 8, remainingMs: 30_000 });
    expect(timerPhase(run, totalMs(defaultInterval))).toMatchObject({ phase: 'done', round: 8 });
  });

  it('la pausa congela el tiempo y no programa aviso', () => {
    const paused = pauseTimer(startTimer({ kind: 'hold', seconds: 30 }, 0), 10_000);
    expect(timerPhase(paused, 999_000).remainingMs).toBe(20_000);
    expect(endsInMs(paused, 999_000)).toBeNull();
    expect(endsInMs(resumeTimer(paused, 50_000), 55_000)).toBe(15_000);
  });

  it('valida intervalos configurados', () => {
    expect(validInterval(40, 20, 8)).toBeNull();
    expect(validInterval(2, 20, 8)).toMatch(/trabajo/);
    expect(validInterval(40, 20, 0)).toMatch(/rondas/);
  });
});
