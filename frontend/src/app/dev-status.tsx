import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { fetchHealth } from '../lib/api';
import { apiUrl } from '../lib/env';

export default function DevStatusScreen() {
  const health = useQuery({
    queryKey: ['health', apiUrl],
    queryFn: ({ signal }) => fetchHealth(apiUrl, signal),
    enabled: __DEV__,
  });

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen title="Conexión con la API">
      <Text selectable className="mb-6 text-base text-muted">{apiUrl}</Text>
      <Text accessibilityLiveRegion="polite" className="text-lg leading-7 text-ink">
        {health.isFetching ? 'Comprobando conexión…' : health.isError
          ? 'No se pudo conectar. Inicia el backend y revisa la dirección de la API.'
          : health.data ? 'La API está disponible.' : 'Conexión pendiente.'}
      </Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: health.isFetching }}
        disabled={health.isFetching} onPress={() => void health.refetch()}
        className="mt-8 min-h-12 items-center justify-center rounded-xl bg-brand px-6 py-4 active:opacity-80 disabled:opacity-50">
        <Text className="text-base font-semibold text-white">Volver a comprobar</Text>
      </Pressable>
      <Text className="mt-6 text-base leading-6 text-muted">Esta comprobación verifica la API, no la conexión con la base de datos.</Text>
    </Screen>
  );
}
