import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { onboardingPayload } from '../features/account/data/account.mappers';
import { clearPendingOnboarding } from '../features/account/pendingOnboarding';
import { signOutAndPurge } from '../features/account/session';
import { useOptionalUserId } from '../features/account/SessionContext';
import { useSaveOnboarding } from '../features/account/useAccount';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useProfile } from '../features/profile/useProfile';
import { dataErrorMessage, toDataError } from '../lib/data/errors';
import { todayDateKey } from '../shared/calendar';

// AU-01: el onboarding va antes de la cuenta. Sin sesión el perfil queda como pendiente local y se
// guarda al iniciar sesión; con sesión (cuenta sin perfil) se guarda directo.
export default function OnboardingRoute() {
  const userId = useOptionalUserId();
  return userId ? <SignedInOnboarding userId={userId} /> : <SignedOutOnboarding />;
}

function SignedInOnboarding({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const save = useSaveOnboarding(userId);
  const today = todayDateKey();
  return <OnboardingScreen today={today} onExit={() => signOutAndPurge(queryClient)}
    onComplete={async (result) => {
      try {
        await save.mutateAsync(onboardingPayload(result, today));
        return null;
      } catch (error) {
        return dataErrorMessage(toDataError(error));
      }
    }} />;
}

function SignedOutOnboarding() {
  const router = useRouter();
  const { dispatch } = useProfile();
  const today = todayDateKey();
  return <OnboardingScreen today={today} exitLabel="Volver"
    onExit={() => { void clearPendingOnboarding().catch(() => undefined); router.dismissTo('/welcome'); }}
    onComplete={async (result) => {
      const { ok: _ok, ...profile } = result;
      dispatch({ type: 'complete-onboarding', ...profile });
      void clearPendingOnboarding().catch(() => undefined);
      router.replace('/');
      return null;
    }} />;
}
