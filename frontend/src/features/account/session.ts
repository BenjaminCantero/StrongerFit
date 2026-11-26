import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryPersister } from '../../lib/data/query';
import { getSupabase } from '../../lib/supabase';
import { clearValues, readValue, writeValue } from '../../storage/keyValue';
import { clearPendingSession } from '../../storage/pendingSession';
import { clearSessionDraft } from '../../storage/sessionDraft';
import { clearPendingOnboarding } from '../../storage/pendingOnboarding';
import { resetNutritionDiary } from '../nutrition/useNutritionDiary';
import { resetProfile } from '../profile/useProfile';
import { resetProgress } from '../progress/useProgress';
import { resetSleep } from '../sleep/useSleep';
import { shouldPurge } from './access';

const LAST_USER_KEY = 'last-user-id';

// Borra todo lo que la app guarda de una persona en el teléfono (RNF-05): caché de datos,
// borrador de sesión, valores locales y los estados en memoria.
// NO borra el onboarding pendiente (pendingOnboarding): se crea justo antes de iniciar sesión y
// esta purga corre al entrar la cuenta, así que lo perdería. Ese pendiente se borra al guardarse,
// al descartarse, al caducar (7 días), al salir del onboarding sin cuenta y en signOutAndPurge.
export async function purgeLocalData(queryClient: QueryClient) {
  queryClient.clear();
  resetProfile();
  resetNutritionDiary();
  resetProgress();
  resetSleep();
  const tasks = [queryPersister?.removeClient(), clearValues(), clearSessionDraft(), clearPendingSession()];
  await Promise.all(tasks.map((task) => Promise.resolve(task).catch(() => undefined)));
}

// Cierre de sesión elegido por la persona: limpia primero (incluido el onboarding pendiente) y luego revoca la sesión.
export async function signOutAndPurge(queryClient: QueryClient) {
  await purgeLocalData(queryClient);
  await clearPendingOnboarding().catch(() => undefined);
  await getSupabase().auth.signOut().catch(() => undefined);
}

// Al abrir sesión: si es otra cuenta distinta de la última, se limpian los datos locales.
// Una sesión vencida de la misma persona conserva el borrador sin enviar (RNF-06).
export function useSessionLifecycle(queryClient: QueryClient, userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const last = await readValue(LAST_USER_KEY).catch(() => null);
      if (cancelled) return;
      if (shouldPurge(last, userId)) await purgeLocalData(queryClient);
      await writeValue(LAST_USER_KEY, userId).catch(() => undefined);
    })();
    return () => { cancelled = true; };
  }, [queryClient, userId]);
}
