import { Link } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../../components/Screen';

export default function ProfileScreen() {
  return (
    <Screen title="Perfil">
      <Text className="text-lg leading-7 text-ink">Aquí podrás gestionar tu cuenta, objetivos, preferencias y privacidad.</Text>
      <Text className="mt-6 text-base leading-6 text-muted">El registro y la configuración de tu perfil estarán disponibles en una próxima etapa.</Text>
      {__DEV__ && <Link href="/dev-status" className="mt-10 py-4 text-base font-semibold text-brand">Comprobar conexión de desarrollo</Link>}
    </Screen>
  );
}
