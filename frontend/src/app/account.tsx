import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreen } from '../features/account/AuthScreen';
import { isAuthConfigured, submitAuth, type AuthMode } from '../features/account/auth';
import { isProfileEmpty } from '../features/profile/domain/profile';
import { useProfile } from '../features/profile/useProfile';

export default function AccountRoute() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: AuthMode }>();
  const { profile } = useProfile();
  // Sin perfil en el dispositivo se sigue al onboarding; con perfil, a Inicio.
  const next = () => isProfileEmpty(profile) ? router.replace('/onboarding') : router.replace('/');
  return <AuthScreen initialMode={mode === 'signup' || mode === 'reset' ? mode : 'signin'} configured={isAuthConfigured()}
    onSubmit={submitAuth} onSignedIn={next} onContinueLocal={next} />;
}
