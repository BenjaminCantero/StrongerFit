import { useRouter } from 'expo-router';
import { WelcomeScreen } from '../features/onboarding/WelcomeScreen';

export default function WelcomeRoute() {
  const router = useRouter();
  return <WelcomeScreen onStart={() => router.push('/onboarding')} />;
}
