import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '../../features/profile/useProfile';
import { ProgressScreen } from '../../features/progress/ProgressScreen';
import { useProgressStore } from '../../features/progress/useProgress';
import { parseWeight } from '../../features/progress/domain/progress';
import { useRecordWeight } from '../../features/nutrition/useNutrition';
import { usePreviewMode } from '../../features/dev/previewMode';
import { useOptionalUserId } from '../../features/account/SessionContext';
import { todayDateKey } from '../../shared/calendar';

export default function ProgressRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = preview === 'empty';
  const progress = useProgressStore(empty);
  const record = useRecordWeight();
  const userId = useOptionalUserId();
  const previewMode = usePreviewMode();
  const { profile } = useProfile(empty);
  return <ProgressScreen today={todayDateKey()} isPreview={previewMode && !empty} state={progress} dispatch={(action) => {
      if (action.type !== 'record-weight') return progress.dispatch(action);
      const kg = parseWeight(action.value);
      if (kg !== null && userId) record.mutate({ date: action.date, kg });
      else progress.dispatch(action);
    }}
    goal={profile.onboarding?.weightGoal ?? null} />;
}
