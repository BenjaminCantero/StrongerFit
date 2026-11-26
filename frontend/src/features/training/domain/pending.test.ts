import { describe, expect, it } from 'vitest';
import { parsePending } from './pending';

const valid = {
  title: 'Día A', completedSets: 2, totalSets: 3,
  payload: { client_id: '6f1c1d6e-1b7a-4c1e-9a55-2f1d3c4b5a69', plan_id: null, day_id: null, title: 'Día A',
    started_at: '2026-11-26T15:00:00.000Z', finished_at: '2026-11-26T15:30:00.000Z',
    sets: [{ exercise_id: 'goblet-squat', exercise_position: 0, set_number: 1, weight_kg: 20, reps: 10, duration_seconds: null,
      completed: true, kind: 'work', reserve: null, estimated: false }] },
};

describe('sesión pendiente de envío', () => {
  it('lee una sesión válida', () => {
    expect(parsePending(JSON.stringify(valid))).toEqual(valid);
  });

  it('descarta lo que no valida (RNF-13)', () => {
    expect(parsePending(null)).toBeNull();
    expect(parsePending('{')).toBeNull();
    expect(parsePending(JSON.stringify({ ...valid, payload: { ...valid.payload, client_id: 'session-1' } }))).toBeNull();
  });
});
