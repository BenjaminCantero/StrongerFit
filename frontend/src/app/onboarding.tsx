import { useQueryClient } from '@tanstack/react-query';
import { onboardingPayload } from '../features/account/data/account.mappers';
import { signOutAndPurge } from '../features/account/session';
import { useUserId } from '../features/account/SessionContext';
import { useSaveOnboarding } from '../features/account/useAccount';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useProfile } from '../features/profile/useProfile';
import { dataErrorMessage, toDataError } from '../lib/data/errors';
import { todayDateKey } from '../shared/calendar';

export default function OnboardingRoute() {
  const queryClient = useQueryClient();
  const save = useSaveOnboarding(useUserId());
  const { dispatch } = useProfile();
  const today = todayDateKey();
  return <OnboardingScreen today={today} onExit={() => signOutAndPurge(queryClient)}
    onComplete={async (result) => {
      try {
        await save.mutateAsync(onboardingPayload(result, today));
        // Las pantallas que aún leen el perfil en memoria lo reciben también (hasta SY-02).
        const { ok: _ok, ...action } = result;
        dispatch({ type: 'complete-onboarding', ...action });
        return null;
      } catch (error) {
        return dataErrorMessage(toDataError(error));
      }
    }} />;
}
