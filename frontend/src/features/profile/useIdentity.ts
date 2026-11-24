import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { userKey } from '../../lib/data/keys';
import { SessionContext } from '../account/SessionContext';
import type { Environment, Equipment, Goal, Zone } from '../onboarding/domain/onboarding';
import { todayDateKey } from '../../shared/calendar';
import type { NutritionValues } from './components/ProfileEditors';
import type { Identity } from './data/identity.mappers';
import { fetchIdentity, saveNutritionPreferences, savePersonal, saveTrainingSetup } from './data/identity.repository';
import type { PersonalValues } from './domain/profile';

export const identityKey = (userId: string) => userKey(userId, 'identity');

// Identidad guardada en Supabase (SY-02). Sin sesión no consulta.
export function useIdentity() {
  const { userId } = useContext(SessionContext);
  return useQuery({ queryKey: identityKey(userId ?? 'anon'), queryFn: fetchIdentity, enabled: userId !== null });
}

function useIdentityMutation<T>(write: (input: T) => Promise<void>) {
  const { userId } = useContext(SessionContext);
  const client = useQueryClient();
  return useMutation({
    mutationFn: write,
    // La identidad alimenta metas, rutina y minuta: se refresca todo lo de la persona.
    onSuccess: () => client.invalidateQueries({ queryKey: userKey(userId ?? 'anon') }),
  });
}

export const useSavePersonal = () => useIdentityMutation(({ current, values, goal }: { current: Identity; values: PersonalValues; goal: Goal }) =>
  savePersonal(current, values, goal, todayDateKey()));
export const useSaveNutrition = () => useIdentityMutation((values: NutritionValues) => saveNutritionPreferences(values));
export const useSaveTrainingSetup = () => useIdentityMutation(({ current, setup }: { current: Identity; setup: { environment: Environment; equipment: Equipment[]; zones: Zone[] } }) =>
  saveTrainingSetup(current, setup));
