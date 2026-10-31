import { describe, expect, it } from 'vitest';
import { sessionPreview } from '../data/session.preview';
import { createDraft, parseDraft } from './draft';
import { createSession, sessionReducer } from './session';

const now = new Date('2026-10-30T20:00:00Z');

describe('borrador de la sesión', () => {
  it('recupera la sesión en curso tal como quedó (CA-03)', () => {
    const state = sessionReducer(createSession(sessionPreview, 1000), { type: 'add-set' });
    const draft = createDraft('session-1', { kind: 'sample' }, state, now);
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it('descarta borradores finalizados, dañados o con forma inválida', () => {
    const finished = sessionReducer(createSession(sessionPreview, 0), { type: 'finish', now: 1 });
    expect(parseDraft(JSON.stringify(createDraft('s', { kind: 'sample' }, finished, now)))).toBeNull();
    expect(parseDraft('{no es json')).toBeNull();
    expect(parseDraft(JSON.stringify({ version: 1, sessionId: 's' }))).toBeNull();
    const broken = createDraft('s', { kind: 'plan', day: 0 }, { ...createSession(sessionPreview, 0), exerciseIndex: 99 }, now);
    expect(parseDraft(JSON.stringify(broken))).toBeNull();
    expect(parseDraft(null)).toBeNull();
  });
});
