import { useQuery } from '@tanstack/react-query';
import { Pressable, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { fetchHealth } from '../../lib/api';
import { apiUrl } from '../../lib/env';
import { setPreviewMode, usePreviewMode } from './previewMode';

// Solo se carga en desarrollo, desde app/dev-status.tsx.
export function DevStatusScreen() {
  const preview = usePreviewMode();
  const health = useQuery({
    queryKey: ['health', apiUrl],
    queryFn: ({ signal }) => fetchHealth(apiUrl, signal),
  });

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
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: preview }} onPress={() => setPreviewMode(!preview)}
        className="mt-8 min-h-12 items-center justify-center rounded-xl border border-brand px-6 py-4 active:opacity-80">
        <Text className="text-base font-semibold text-brand">{preview ? 'Ocultar datos de ejemplo' : 'Mostrar datos de ejemplo'}</Text>
      </Pressable>
    </Screen>
  );
}
