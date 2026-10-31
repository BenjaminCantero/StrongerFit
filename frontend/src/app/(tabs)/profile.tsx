import { useLocalSearchParams, useRouter } from 'expo-router';
import { pickProfilePhoto, shareJsonExport } from '../../features/profile/device';
import { buildLocalExport } from '../../features/profile/domain/profile';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { useProfile } from '../../features/profile/useProfile';
import { nutritionDiarySnapshot, resetNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { progressSnapshot, resetProgress } from '../../features/progress/useProgress';
import { todayDateKey } from '../../shared/calendar';
import { clearSessionDraft } from '../../storage/sessionDraft';

export default function ProfileRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = preview === 'empty';
  const { profile, dispatch } = useProfile(empty);
  const isPreview = __DEV__ && !empty;
  const router = useRouter();

  return <ProfileScreen profile={profile} dispatch={dispatch} isPreview={isPreview} onPickPhoto={pickProfilePhoto} onGoals={() => router.push('/nutrition-goals')}
    onExport={() => shareJsonExport(`strongerfit-datos-${todayDateKey()}.json`, buildLocalExport({
      profile, exportedAt: new Date(), isPreview, nutritionDiary: nutritionDiarySnapshot(), progress: progressSnapshot(),
    }))}
    onDeleteLocalData={() => { dispatch({ type: 'reset' }); resetNutritionDiary(); resetProgress(); clearSessionDraft().catch(() => undefined); }} />;
}
