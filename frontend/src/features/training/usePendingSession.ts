import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useRef, useState } from 'react';
import { dataErrorMessage, toDataError } from '../../lib/data/errors';
import { clearPendingSession, readPendingSession, writePendingSession } from '../../storage/pendingSession';
import { SessionContext } from '../account/SessionContext';
import { submitSession } from './data/training.repository';
import { parsePending, type PendingSession } from './domain/pending';
import { trainingKey } from './useTraining';

// Envía la sesión terminada. Primero queda guardada en el teléfono; se borra al confirmar el
// servidor. Si falla, queda pendiente y Inicio ofrece reintentar (RNF-06, CA-03).
export function usePendingSession() {
  const { userId } = useContext(SessionContext);
  const client = useQueryClient();
  const [pending, setPending] = useState<PendingSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const send = useCallback(async (session: PendingSession) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitSession(session.payload);
      await clearPendingSession().catch(() => undefined);
      setPending(null);
      await client.invalidateQueries({ queryKey: trainingKey(userId ?? 'anon') });
    } catch (failure) {
      setPending(session);
      setError(dataErrorMessage(toDataError(failure)));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [client, userId]);

  const submit = useCallback((session: PendingSession) => {
    setPending(session);
    writePendingSession(JSON.stringify(session)).catch(() => undefined).finally(() => { void send(session); });
  }, [send]);

  // Al volver a la pantalla, si quedó una sesión sin enviar se intenta una vez.
  useFocusEffect(useCallback(() => {
    let active = true;
    readPendingSession().then(parsePending).then((saved) => {
      if (!active || !saved) return;
      setPending(saved);
      void send(saved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [send]));

  const retry = useCallback(() => { if (pending) void send(pending); }, [pending, send]);
  return { pending, submit, retry, submitting, error };
}
