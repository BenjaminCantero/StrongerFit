import { useRouter } from 'expo-router';
import { ProgramsScreen } from '../../features/training/ProgramsScreen';
import { planInput } from '../../features/training/domain/plan';
import { useProfile } from '../../features/profile/useProfile';

export default function ProgramsRoute() {
  const router = useRouter();
  const { profile } = useProfile();
  return <ProgramsScreen input={planInput(profile)} activeId={profile.trainingPlan?.templateId ?? null}
    onProfile={() => router.push('/onboarding')}
    onOpen={(program) => router.push({ pathname: '/programs/[id]', params: { id: program.id } })} />;
}
