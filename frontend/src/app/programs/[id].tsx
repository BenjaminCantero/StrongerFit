import { programById } from '@strongerfit/training-engine';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { ProgramDetailScreen } from '../../features/training/ProgramDetailScreen';
import { planInput } from '../../features/training/domain/plan';
import { useProfile } from '../../features/profile/useProfile';

export default function ProgramDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, dispatch } = useProfile();
  const program = programById(id);
  const input = planInput(profile);
  if (!program || !input) return <Screen title="Programa no disponible" safeBottom>
    <AppText>{program ? 'Completa tu perfil para adaptar este programa a tu equipo.' : 'Este programa no existe.'}</AppText>
    <AppButton label="Volver a programas" onPress={() => router.navigate('/programs')} />
  </Screen>;
  return <ProgramDetailScreen program={program} input={input} hasPlan={profile.trainingPlan !== null}
    active={profile.trainingPlan?.templateId === program.id}
    onApply={(plan) => {
      dispatch({ type: 'set-training-plan', plan: { ...plan, createdAt: new Date().toISOString() } });
      router.dismissTo('/training');
    }} />;
}
