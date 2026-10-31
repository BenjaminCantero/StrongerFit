import { useLocalSearchParams, useRouter } from 'expo-router';
import { progressStore } from '../features/progress/useProgress';
import { useProfile } from '../features/profile/useProfile';
import { TrainingScreen } from '../features/training/TrainingScreen';
import { sessionPreview } from '../features/training/data/session.preview';
import { sessionFromDay } from '../features/training/domain/plan';

export default function SessionRoute() {
  const router = useRouter();
  const { day, preview } = useLocalSearchParams<{ day?: string; preview?: string }>();
  const { profile } = useProfile();
  const planDay = profile.trainingPlan?.days[Number(day)];
  // La sesión de ejemplo con historial solo existe en desarrollo.
  const sample = __DEV__ && preview === 'sample';
  const template = sample ? sessionPreview : planDay ? sessionFromDay(planDay) : null;
  return <TrainingScreen template={template} sample={sample}
    onExit={() => router.navigate('/')} onViewHistory={() => router.navigate('/progress')}
    onRecord={(record) => progressStore.getState().dispatch({ type: 'record-workout', record })} />;
}
