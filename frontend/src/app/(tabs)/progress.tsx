import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '../../features/profile/useProfile';
import { ProgressScreen } from '../../features/progress/ProgressScreen';
import { useProgressStore } from '../../features/progress/useProgress';
import { todayDateKey } from '../../shared/calendar';

export default function ProgressRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = preview === 'empty';
  const progress = useProgressStore(empty);
  const { profile } = useProfile(empty);
  return <ProgressScreen today={todayDateKey()} isPreview={__DEV__ && !empty} state={progress} dispatch={progress.dispatch}
    goal={profile.onboarding?.weightGoal ?? null} />;
}
