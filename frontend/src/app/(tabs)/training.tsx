import { useLocalSearchParams, useRouter } from 'expo-router';
import { TrainingScreen } from '../../features/training/TrainingScreen';
import { sessionPreview } from '../../features/training/data/session.preview';
import { progressStore } from '../../features/progress/useProgress';

export default function TrainingRoute() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  return <TrainingScreen template={__DEV__ && preview !== 'empty' ? sessionPreview : null}
    onExit={() => router.navigate('/')} onViewHistory={() => router.navigate('/progress')}
    onRecord={(record) => progressStore.getState().dispatch({ type: 'record-workout', record })} />;
}
