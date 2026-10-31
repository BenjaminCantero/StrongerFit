import { useState } from 'react';
import { useStore } from 'zustand';
import { createProfilePreview } from './data/profile.preview';
import { createEmptyProfile } from './domain/profile';
import { createProfileStore } from './state/profile-store';

// Perfil local en memoria. Sin cuenta, persistencia ni llamadas de red.
const profileStore = createProfileStore(__DEV__ ? createProfilePreview() : createEmptyProfile());

export function useProfile(empty = false) {
  const [emptyStore] = useState(() => createProfileStore(createEmptyProfile()));
  return useStore(empty ? emptyStore : profileStore);
}
