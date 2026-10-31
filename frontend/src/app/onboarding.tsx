import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useProfile } from '../features/profile/useProfile';
import { todayDateKey } from '../shared/calendar';

export default function OnboardingRoute() {
  const router = useRouter();
  const { dispatch } = useProfile();
  return <OnboardingScreen today={todayDateKey()} dispatch={dispatch}
    onDone={() => router.replace('/')} onExit={() => router.dismissTo('/welcome')} />;
}
