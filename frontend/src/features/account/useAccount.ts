import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKey } from '../../lib/data/keys';
import { fetchAccountStatus, recordConsent, saveOnboarding } from './data/account.repository';
import type { OnboardingPayload } from './data/account.mappers';

export const accountStatusKey = (userId: string) => userKey(userId, 'account-status');

export function useAccountStatus(userId: string | null) {
  return useQuery({
    queryKey: accountStatusKey(userId ?? 'anon'),
    queryFn: fetchAccountStatus,
    enabled: userId !== null,
    // Las rutas dependen de este dato: siempre se confirma con el servidor al abrir la app.
    staleTime: 0,
  });
}

// Tras guardar se invalida todo lo de la persona: el onboarding crea datos de varios dominios.
export function useSaveOnboarding(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: OnboardingPayload) => saveOnboarding(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: userKey(userId) }),
  });
}

export function useRecordConsent(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ action, version }: { action: 'granted' | 'withdrawn'; version: string }) => recordConsent(action, version),
    onSuccess: () => client.invalidateQueries({ queryKey: userKey(userId) }),
  });
}
