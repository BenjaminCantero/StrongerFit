import { createStore } from 'zustand/vanilla';
import { profileReducer, type ProfileAction, type ProfileData } from '../domain/profile';

type ProfileStore = { profile: ProfileData; dispatch: (action: ProfileAction) => void };

export function createProfileStore(initial: ProfileData) {
  return createStore<ProfileStore>()((set) => ({
    profile: initial,
    dispatch: (action) => set((state) => ({ profile: profileReducer(state.profile, action) })),
  }));
}
