import { useQueryClient } from '@tanstack/react-query';
import { ConsentScreen } from '../features/account/GateScreens';
import { signOutAndPurge } from '../features/account/session';
import { useUserId } from '../features/account/SessionContext';
import { useRecordConsent } from '../features/account/useAccount';
import { CONSENT_VERSION } from '../features/onboarding/domain/onboarding';
import { dataErrorMessage, toDataError } from '../lib/data/errors';

export default function ConsentRoute() {
  const queryClient = useQueryClient();
  const record = useRecordConsent(useUserId());
  return <ConsentScreen onSignOut={() => signOutAndPurge(queryClient)} onAccept={async () => {
    try {
      await record.mutateAsync({ action: 'granted', version: CONSENT_VERSION });
      return null;
    } catch (error) {
      return dataErrorMessage(toDataError(error));
    }
  }} />;
}
