import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { readValue, writeValue } from '../../storage/keyValue';
import { createProfilePreview } from './data/profile.preview';
import { createEmptyProfile, type ProfilePhoto } from './domain/profile';
import { createProfileStore } from './state/profile-store';
import { useMealPlan, useNutritionPlan } from '../nutrition/useNutrition';
import { useActivePlan, useTrainingHistory } from '../training/useTraining';
import { usePreviewMode } from '../dev/previewMode';
import { useIdentity } from './useIdentity';

// La identidad (ficha, metas, preferencias, lesiones, cuestionario y consentimiento) viene de
// Supabase (SY-02); la rutina y las cargas pendientes (SY-03), y la meta nutricional y la
// minuta (SY-04), también. Los datos de ejemplo solo se ven con el modo vista previa.
const profileStore = createProfileStore(createEmptyProfile());
const previewProfile = createProfilePreview();

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
  const preview = usePreviewMode();
  const plan = useActivePlan();
  const nutrition = useNutritionPlan();
  const meals = useMealPlan();
  const history = useTrainingHistory();
  const profile = useMemo(() => {
    if (preview && !empty) return { ...previewProfile, photo: local.profile.photo };
    if (empty || !identity.data) return local.profile;
    return {
      ...local.profile, ...identity.data,
      // SY-03: rutina y cargas pendientes vienen del servidor cuando ya respondió.
      ...(plan.isSuccess ? { trainingPlan: plan.data } : {}),
      ...(history.isSuccess ? { nextLoads: history.data.nextLoads } : {}),
      // SY-04: meta nutricional y minuta.
      ...(nutrition.isSuccess ? { nutritionPlan: nutrition.data } : {}),
      ...(meals.isSuccess ? { mealPlan: meals.data } : {}),
    };
  }, [preview, empty, identity.data, local.profile, plan.isSuccess, plan.data, history.isSuccess, history.data,
    nutrition.isSuccess, nutrition.data, meals.isSuccess, meals.data]);
  return { profile, dispatch: local.dispatch, identity };
}

// Vacía el perfil en memoria al cambiar de cuenta o cerrar sesión.
export const resetProfile = () => profileStore.getState().dispatch({ type: 'reset' });
