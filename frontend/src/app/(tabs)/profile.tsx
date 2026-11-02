import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteAccount, signOut, useAuthSession } from '../../features/account/auth';
import { pickProfilePhoto, shareJsonExport } from '../../features/profile/device';
import { buildLocalExport } from '../../features/profile/domain/profile';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { useProfile } from '../../features/profile/useProfile';
import { nutritionDiarySnapshot, resetNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { progressSnapshot, resetProgress } from '../../features/progress/useProgress';
import { resetSleep, sleepStore } from '../../features/sleep/useSleep';
import { todayDateKey } from '../../shared/calendar';
import { clearSessionDraft } from '../../storage/sessionDraft';

export default function ProfileRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = preview === 'empty';
  const { profile, dispatch } = useProfile(empty);
  const isPreview = __DEV__ && !empty;
  const router = useRouter();
  const auth = useAuthSession();

  return <ProfileScreen profile={profile} dispatch={dispatch} account={{ configured: auth.configured, email: auth.session?.user.email ?? null }}
    onSignIn={() => router.push({ pathname: '/account', params: { mode: 'signin' } })} onSignUp={() => router.push({ pathname: '/account', params: { mode: 'signup' } })}
    onSignOut={signOut} onDeleteAccount={deleteAccount} isPreview={isPreview} onPickPhoto={pickProfilePhoto} onGoals={() => router.push('/nutrition-goals')}
    onExport={() => shareJsonExport(`strongerfit-datos-${todayDateKey()}.json`, buildLocalExport({
      profile, exportedAt: new Date(), isPreview, nutritionDiary: nutritionDiarySnapshot(), progress: progressSnapshot(),
      sleep: { records: sleepStore.getState().records, cycleMinutes: sleepStore.getState().cycleMinutes },
    }))}
    onDeleteLocalData={() => { dispatch({ type: 'reset' }); resetNutritionDiary(); resetProgress(); resetSleep(); clearSessionDraft().catch(() => undefined); }} />;
}
