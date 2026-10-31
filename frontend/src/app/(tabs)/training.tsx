import { useRouter } from 'expo-router';
import { PlanScreen } from '../../features/training/PlanScreen';
import { useSessionDraft } from '../../features/training/useSessionDraft';
import { useProfile } from '../../features/profile/useProfile';

export default function TrainingRoute() {
  const router = useRouter();
  const { profile, dispatch } = useProfile();
  const { draft, discard } = useSessionDraft();
  return <PlanScreen profile={profile} dispatch={dispatch} draft={draft} onDiscard={discard}
    onResume={() => router.push({ pathname: '/session', params: { resume: '1' } })}
    onStart={(day) => router.push({ pathname: '/session', params: { day: String(day) } })} />;
}
