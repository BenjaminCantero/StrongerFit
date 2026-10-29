import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';

export default function HomeScreen() {
  return (
    <Screen title="StrongerFit">
      <Text className="text-2xl font-semibold leading-8 text-ink">Tu entrenamiento y alimentación, en un mismo lugar.</Text>
      <Text className="mt-4 text-base leading-7 text-muted">Estamos construyendo tu espacio para organizar rutinas, registrar comidas y seguir tu progreso.</Text>
      <View className="mt-10 border-t border-line">
        <Link href="/training" asChild>
          <Pressable accessibilityRole="link" className="min-h-16 justify-center border-b border-line py-5 active:opacity-60">
            <Text className="text-lg font-semibold text-brand">Explorar entrenamiento</Text>
            <Text className="mt-1 text-base text-muted">Rutinas, sesiones e historial.</Text>
          </Pressable>
        </Link>
        <Link href="/nutrition" asChild>
          <Pressable accessibilityRole="link" className="min-h-16 justify-center border-b border-line py-5 active:opacity-60">
            <Text className="text-lg font-semibold text-brand">Explorar alimentación</Text>
            <Text className="mt-1 text-base text-muted">Diario de comidas y minuta semanal.</Text>
          </Pressable>
        </Link>
      </View>
      <Text className="mt-8 text-sm leading-6 text-muted">Versión inicial en desarrollo. Las funciones de registro y planificación aún no están habilitadas.</Text>
    </Screen>
  );
}
