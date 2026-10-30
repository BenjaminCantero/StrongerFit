import { useLocalSearchParams, useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';
import { createEmptyHome, homePreview } from '../../features/home/home.preview';

export default function HomeRoute() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = __DEV__ && preview !== 'empty';

  return <HomeScreen overview={isPreview ? homePreview : createEmptyHome()} isPreview={isPreview}
    onTrainingPress={() => router.navigate('/training')}
    onNutritionPress={() => router.navigate('/nutrition')} />;
}
