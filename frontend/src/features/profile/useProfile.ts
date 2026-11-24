import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { readValue, writeValue } from '../../storage/keyValue';
import { createProfilePreview } from './data/profile.preview';
import { createEmptyProfile, type ProfilePhoto } from './domain/profile';
import { createProfileStore } from './state/profile-store';
import { useIdentity } from './useIdentity';

// La identidad (ficha, metas, preferencias, lesiones, cuestionario y consentimiento) viene de
// Supabase (SY-02). Planes, minuta y cargas siguen en memoria hasta SY-03 y SY-04; en
// desarrollo parten con datos de ejemplo.
const profileStore = createProfileStore(__DEV__ ? createProfilePreview() : createEmptyProfile());

// La foto de perfil es un archivo local: solo su referencia se guarda en el teléfono.
const PHOTO_KEY = 'profile-photo';
readValue(PHOTO_KEY).then((value) => {
  if (value) profileStore.getState().dispatch({ type: 'set-photo', photo: JSON.parse(value) as ProfilePhoto });
}).catch(() => undefined);
profileStore.subscribe((state, previous) => {
  if (state.profile.photo !== previous.profile.photo) {
    writeValue(PHOTO_KEY, state.profile.photo ? JSON.stringify(state.profile.photo) : null).catch(() => undefined);
  }
});

export function useProfile(empty = false) {
  const [emptyStore] = useState(() => createProfileStore(createEmptyProfile()));
  const local = useStore(empty ? emptyStore : profileStore);
  const identity = useIdentity();
  const profile = useMemo(() => !empty && identity.data ? { ...local.profile, ...identity.data } : local.profile, [empty, identity.data, local.profile]);
  return { profile, dispatch: local.dispatch, identity };
}

// Vacía el perfil en memoria al cambiar de cuenta o cerrar sesión.
export const resetProfile = () => profileStore.getState().dispatch({ type: 'reset' });
