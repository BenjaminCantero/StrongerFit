import { Link } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/ui/AppText';

export default function ProfileScreen() {
  return (
    <Screen title="Perfil">
      <AppText>Aquí podrás gestionar tu cuenta, objetivos, preferencias y privacidad.</AppText>
      <AppText tone="muted">El registro y la configuración de tu perfil estarán disponibles en una próxima etapa.</AppText>
      {__DEV__ && <Link href="/dev-status" className="mt-10 py-4 text-base font-semibold text-brand">Comprobar conexión de desarrollo</Link>}
    </Screen>
  );
}
