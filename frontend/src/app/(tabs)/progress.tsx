import { useLocalSearchParams } from 'expo-router';
import { ProgressScreen } from '../../features/progress/ProgressScreen';
import { createProgressPreview } from '../../features/progress/data/progress.preview';
import { createEmptyProgress } from '../../features/progress/domain/progress';
import { todayDateKey } from '../../shared/calendar';

export default function ProgressRoute() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = __DEV__ && preview !== 'empty';
  const today = todayDateKey();
  return <ProgressScreen key={isPreview ? 'preview' : 'empty'} today={today} isPreview={isPreview}
    initial={isPreview ? createProgressPreview(today) : createEmptyProgress()} />;
}
