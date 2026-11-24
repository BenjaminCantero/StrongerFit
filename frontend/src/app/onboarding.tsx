import { useQueryClient } from '@tanstack/react-query';
import { onboardingPayload } from '../features/account/data/account.mappers';
import { signOutAndPurge } from '../features/account/session';
import { useUserId } from '../features/account/SessionContext';
import { useSaveOnboarding } from '../features/account/useAccount';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { dataErrorMessage, toDataError } from '../lib/data/errors';
import { todayDateKey } from '../shared/calendar';

export default function OnboardingRoute() {
  const queryClient = useQueryClient();
  const save = useSaveOnboarding(useUserId());
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
