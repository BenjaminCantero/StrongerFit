import { useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '../features/account/AuthScreen';
import { submitAuth, type AuthMode } from '../features/account/auth';

// Al iniciar sesión las guardas del layout raíz llevan al onboarding o a Inicio (AU-01).
export default function AccountRoute() {
  const { mode } = useLocalSearchParams<{ mode?: AuthMode }>();
  return <AuthScreen initialMode={mode === 'signup' || mode === 'reset' ? mode : 'signin'} onSubmit={submitAuth} />;
}
