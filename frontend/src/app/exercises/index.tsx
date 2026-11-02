import { useRouter } from 'expo-router';
import { ExerciseCatalogScreen } from '../../features/training/ExerciseCatalogScreen';

export default function ExerciseCatalogRoute() {
  const router = useRouter();
  return <ExerciseCatalogScreen onOpen={(exercise) => router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } })} />;
}
