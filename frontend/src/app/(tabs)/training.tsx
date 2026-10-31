import { useRouter } from 'expo-router';
import { PlanScreen } from '../../features/training/PlanScreen';
import { useProfile } from '../../features/profile/useProfile';

export default function TrainingRoute() {
  const router = useRouter();
  const { profile, dispatch } = useProfile();
  return <PlanScreen profile={profile} dispatch={dispatch} onStart={(day) => router.push({ pathname: '/session', params: { day: String(day) } })} />;
}
