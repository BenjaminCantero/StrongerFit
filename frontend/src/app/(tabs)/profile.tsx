import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteAccount, useAuthSession } from '../../features/account/auth';
import { purgeLocalData, signOutAndPurge } from '../../features/account/session';
import { pickProfilePhoto, shareJsonExport } from '../../features/profile/device';
import { buildLocalExport } from '../../features/profile/domain/profile';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { useProfile } from '../../features/profile/useProfile';
import { useSaveNutrition, useSavePersonal, useSaveTrainingSetup } from '../../features/profile/useIdentity';
import { useRecordConsent } from '../../features/account/useAccount';
import { useUserId } from '../../features/account/SessionContext';
import { CONSENT_VERSION } from '../../features/onboarding/domain/onboarding';
import { dataErrorMessage, toDataError } from '../../lib/data/errors';
import { nutritionDiarySnapshot, resetNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { progressSnapshot, resetProgress } from '../../features/progress/useProgress';
import { resetSleep, sleepStore } from '../../features/sleep/useSleep';
import { todayDateKey } from '../../shared/calendar';
import { usePreviewMode } from '../../features/dev/previewMode';
import { clearSessionDraft } from '../../storage/sessionDraft';

export default function ProfileRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = preview === 'empty';
  const { profile, dispatch, identity } = useProfile(empty);
  const savePersonal = useSavePersonal();
  const saveNutrition = useSaveNutrition();
  const saveTraining = useSaveTrainingSetup();
  const recordConsent = useRecordConsent(useUserId());
  const current = identity.data;
  // Cada guardado devuelve null o el mensaje de error para mostrarlo en el diálogo.
  const attempt = (task: () => Promise<unknown>) => task().then(() => null, (error: unknown) => dataErrorMessage(toDataError(error)));
  const missing = async () => 'Tu perfil aún no termina de cargar. Inténtalo de nuevo.';
  const previewMode = usePreviewMode();
  const isPreview = previewMode && !empty;
  const router = useRouter();
  const auth = useAuthSession();
  const queryClient = useQueryClient();

  return <ProfileScreen profile={profile} dispatch={dispatch}
    save={{
      personal: (input) => current ? attempt(() => savePersonal.mutateAsync({ current, ...input })) : missing(),
      nutrition: (values) => attempt(() => saveNutrition.mutateAsync(values)),
      training: (setup) => current ? attempt(() => saveTraining.mutateAsync({ current, setup })) : missing(),
      withdrawConsent: () => attempt(() => recordConsent.mutateAsync({ action: 'withdrawn', version: CONSENT_VERSION })),
    }}
    account={{ configured: auth.configured, email: auth.session?.user.email ?? null }}
    onSignIn={() => router.push({ pathname: '/account', params: { mode: 'signin' } })} onSignUp={() => router.push({ pathname: '/account', params: { mode: 'signup' } })}
    onSignOut={() => signOutAndPurge(queryClient)}
    onDeleteAccount={async (password) => {
      const result = await deleteAccount(password);
      if (result.ok) await purgeLocalData(queryClient);
      return result;
    }} isPreview={isPreview} onPickPhoto={pickProfilePhoto} onGoals={() => router.push('/nutrition-goals')}
    onExport={() => shareJsonExport(`strongerfit-datos-${todayDateKey()}.json`, buildLocalExport({
      profile, exportedAt: new Date(), isPreview, nutritionDiary: nutritionDiarySnapshot(), progress: progressSnapshot(),
      sleep: { records: sleepStore.getState().records, cycleMinutes: sleepStore.getState().cycleMinutes },
    }))}
    onDeleteLocalData={() => { dispatch({ type: 'reset' }); resetNutritionDiary(); resetProgress(); resetSleep(); clearSessionDraft().catch(() => undefined); }} />;
}
