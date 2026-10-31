import { describe, expect, it } from 'vitest';
import { sessionPreview } from '../data/session.preview';
import { activeSet, createSession, currentExercise, elapsedMs, parseSetInput, restRemainingMs, sessionRecord, sessionReducer, sessionSummary,
  type SessionAction } from './session';

const initialTime = 1_000_000;
const initial = () => createSession(sessionPreview, initialTime);
const complete: SessionAction = {
  type: 'complete-set', exerciseId: 'dumbbell-press', setId: 3, weightKg: 26.25, reps: 9, now: initialTime + 2000,
};

describe('registro de sesión', () => {
  it('completa exactamente la serie indicada y conserva las demás y la plantilla', () => {
    const state = initial();
    const updated = sessionReducer(state, complete);
    expect(currentExercise(updated).sets[2]).toMatchObject({ completed: true, weightKg: 26.25, reps: 9 });
    expect(activeSet(currentExercise(updated))?.id).toBe(4);
    expect(activeSet(currentExercise(state))?.id).toBe(3);
    expect(sessionPreview.exercises[0]?.sets[2]?.completed).toBe(false);
    expect(restRemainingMs(updated, initialTime + 2000)).toBe(90_000);
  });

  it('ignora una doble confirmación de la misma serie', () => {
    const state = sessionReducer(initial(), complete);
    expect(sessionReducer(state, complete)).toBe(state);
    expect(currentExercise(state).sets.filter((set) => set.completed)).toHaveLength(3);
  });

  it('rechaza repeticiones inválidas, cargas negativas y acciones de otro ejercicio', () => {
    const state = initial();
    for (const patch of [{ reps: 0 }, { reps: 1.5 }, { weightKg: -1 }, { weightKg: NaN }, { exerciseId: 'other' }]) {
      expect(sessionReducer(state, { ...complete, ...patch })).toBe(state);
    }
  });

  it('añade una serie independiente y permite completar todas sin sobrescribirlas', () => {
    let state = sessionReducer(initial(), { type: 'add-set' });
    expect(currentExercise(state).sets[4]).toMatchObject({ id: 5, completed: false });
    for (const setId of [3, 4, 5]) state = sessionReducer(state, { ...complete, setId });
    expect(activeSet(currentExercise(state))).toBeUndefined();
    expect(currentExercise(state).sets.filter((set) => set.completed)).toHaveLength(5);
  });

  it('cambia de ejercicio conservando las series registradas y limpia el descanso', () => {
    const state = sessionReducer(sessionReducer(initial(), complete), { type: 'next-exercise' });
    expect(currentExercise(state).id).toBe('single-arm-row');
    expect(state.exercises[0]?.sets[2]?.completed).toBe(true);
    expect(activeSet(currentExercise(state))?.id).toBe(1);
    expect(restRemainingMs(state, initialTime)).toBe(0);
    expect(sessionReducer(state, { type: 'next-exercise' })).toBe(state);
  });

  it('congela el reloj y los registros al finalizar, con volumen de series completadas', () => {
    const state = sessionReducer(sessionReducer(initial(), complete), { type: 'finish', now: initialTime + 5000 });
    expect(state.status).toBe('finished');
    expect(sessionSummary(state)).toEqual({ completedSets: 3, totalSets: 7, volumeKg: 450 + 26.25 * 9 });
    expect(elapsedMs(state, initialTime + 100_000)).toBe((24 * 60 + 15 + 5) * 1000);
    expect(sessionReducer(state, { type: 'add-set' })).toBe(state);
    expect(sessionReducer(state, { type: 'toggle-pause', now: initialTime + 6000 })).toBe(state);
  });
});

describe('relojes y validación', () => {
  it('recupera la hora correcta tras un período sin refrescos de interfaz', () => {
    const state = initial();
    expect(restRemainingMs(state, initialTime + 120_000)).toBe(0);
    expect(elapsedMs(state, initialTime + 120_000)).toBe((24 * 60 + 15 + 120) * 1000);
  });

  it('pausa ambos relojes, impide registrar series y reanuda sin contar la pausa', () => {
    const paused = sessionReducer(initial(), { type: 'toggle-pause', now: initialTime + 10_000 });
    expect(restRemainingMs(paused, initialTime + 500_000)).toBe(68_000);
    expect(elapsedMs(paused, initialTime + 500_000)).toBe((24 * 60 + 25) * 1000);
    expect(sessionReducer(paused, complete)).toBe(paused);
    const resumed = sessionReducer(paused, { type: 'toggle-pause', now: initialTime + 500_000 });
    expect(restRemainingMs(resumed, initialTime + 505_000)).toBe(63_000);
    expect(elapsedMs(resumed, initialTime + 505_000)).toBe((24 * 60 + 30) * 1000);
  });

  it('extiende el descanso activo y pausado y permite omitirlo', () => {
    const extended = sessionReducer(initial(), { type: 'add-rest', now: initialTime + 5000 });
    expect(restRemainingMs(extended, initialTime + 5000)).toBe(103_000);
    const paused = sessionReducer(extended, { type: 'toggle-pause', now: initialTime + 5000 });
    const changed = sessionReducer(paused, { type: 'add-rest', now: initialTime + 50_000 });
    expect(restRemainingMs(changed, initialTime + 100_000)).toBe(133_000);
    expect(restRemainingMs(sessionReducer(changed, { type: 'skip-rest' }), initialTime)).toBe(0);
  });

  it('acepta coma decimal y carga cero, sin aceptar campos vacíos o repeticiones fraccionarias', () => {
    expect(parseSetInput('26,25', '9')).toEqual({ weightKg: 26.25, reps: 9 });
    expect(parseSetInput('0', '10')).toEqual({ weightKg: 0, reps: 10 });
    for (const [weight, reps] of [['', '8'], ['25', ''], ['25', '0'], ['25', '2,5'], ['Infinity', '8'], ['-1', '8']]) {
      expect(parseSetInput(weight!, reps!)).toBeNull();
    }
  });
});

describe('registro histórico', () => {
  const meta = { id: 'session-1', date: '2026-10-30', time: '19:40' };

  it('solo genera el registro al finalizar y usa el mismo volumen que el resumen', () => {
    const state = sessionReducer(initial(), complete);
    expect(sessionRecord(state, meta)).toBeNull();
    const finished = sessionReducer(state, { type: 'finish', now: initialTime + 60_000 });
    expect(sessionRecord(finished, meta)).toEqual({ ...meta, name: finished.title, status: 'completed',
      volumeKg: sessionSummary(finished).volumeKg, durationMinutes: Math.round(finished.elapsedMs / 60_000) });
  });

  it('omite una sesión finalizada sin series completadas', () => {
    const template = { ...sessionPreview, exercises: sessionPreview.exercises.map((exercise) => ({
      ...exercise, sets: exercise.sets.map((set) => ({ ...set, completed: false })) })) };
    const finished = sessionReducer(createSession(template, initialTime), { type: 'finish', now: initialTime });
    expect(sessionRecord(finished, meta)).toBeNull();
  });
});
