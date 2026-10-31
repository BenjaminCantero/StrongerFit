import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from '../../storage/sessionDraft';
import { createDraft, parseDraft, type SessionDraft } from './domain/draft';
import type { SessionState } from './domain/session';

export async function loadSessionDraft() {
  return parseDraft(await readSessionDraft().catch(() => null));
}

// Guarda mientras la sesión sigue abierta y borra el borrador al finalizar.
export function persistSessionDraft(sessionId: string, source: SessionDraft['source'], state: SessionState) {
  const task = state.status === 'finished' ? clearSessionDraft() : writeSessionDraft(JSON.stringify(createDraft(sessionId, source, state, new Date())));
  task.catch(() => undefined);
}

export function useSessionDraft() {
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadSessionDraft().then((value) => { if (active) setDraft(value); });
    return () => { active = false; };
  }, []));
  const discard = () => { setDraft(null); clearSessionDraft().catch(() => undefined); };
  return { draft, discard };
}
