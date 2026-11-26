import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { userKey } from '../../lib/data/keys';
import { saveOnboarding } from './data/account.repository';
import type { AccountStatus } from './data/account.mappers';
import { clearPendingOnboarding, decidePending, readPendingOnboarding } from './pendingOnboarding';

type Phase = FinishPhase;

// Lee el pendiente y lo guarda; informa cada fase con `report`. Nunca lanza.
async function finishPending(client: QueryClient, id: string, report: (phase: Phase) => void) {
  const pending = await readPendingOnboarding();
  const sessionEmail = pending ? (await getSupabase().auth.getSession().catch(() => null))?.data.session?.user.email : null;
  const decision = decidePending('needs-onboarding', pending, sessionEmail);
  if (decision === 'discard') await clearPendingOnboarding().catch(() => undefined);
  if (decision !== 'save' || !pending) { report('idle'); return; }
  report('saving');
  try {
    // false = la cuenta ya tenía perfil: no se sobrescribe nada, el pendiente se descarta igual.
    await saveOnboarding(pending.payload);
    await clearPendingOnboarding().catch(() => undefined);
    await client.invalidateQueries({ queryKey: userKey(id) });
    report('idle');
  } catch {
    report('error');
  }
}

// checking: aún se lee el pendiente (evita mostrar el onboarding un instante antes de guardar).
export type FinishPhase = 'idle' | 'checking' | 'saving' | 'error';

// AU-01: tras iniciar sesión, si la cuenta no tiene perfil y hay un onboarding hecho antes de crearla,
// se guarda solo. Un único intento automático por pendiente; Reintentar y Completar de nuevo los
// decide la persona. No navega: al quedar la cuenta lista, las guardas de ruta llevan a Inicio.
export function useFinishPendingOnboarding(userId: string | null, status: AccountStatus | undefined) {
  const client = useQueryClient();
  const [state, setState] = useState<{ userId: string | null; phase: FinishPhase }>({ userId: null, phase: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const lastRun = useRef<string>('');

  const run = useCallback((id: string) => finishPending(client, id, (phase) => setState({ userId: id, phase })), [client]);

  useEffect(() => {
    if (!userId || !status) return;
    const key = `${userId}#${attempt}#${status === 'needs-onboarding'}`;
    if (lastRun.current === key) return; // un solo intento por pendiente
    lastRun.current = key;
    if (status === 'needs-onboarding') { void run(userId); return; }
    // Cuenta con perfil: el pendiente sobra y se borra (minimización de datos de salud).
    void readPendingOnboarding().then((pending) => pending && clearPendingOnboarding()).catch(() => undefined);
  }, [userId, status, attempt, run]);

  const retry = useCallback(() => {
    if (!userId) return;
    setState({ userId, phase: 'saving' });
    setAttempt((current) => current + 1);
  }, [userId]);

  const discard = useCallback(async () => {
    await clearPendingOnboarding().catch(() => undefined);
    setState({ userId, phase: 'idle' });
  }, [userId]);

  const phase: FinishPhase = state.userId === userId ? state.phase : status === 'needs-onboarding' ? 'checking' : 'idle';
  return { phase, retry, discard };
}
