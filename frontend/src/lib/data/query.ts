import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { readValue, writeValue } from '../../storage/keyValue';
import { toDataError } from './errors';

export const CACHE_KEY = 'query-cache';
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Solo se reintentan fallas transitorias; un error de permisos o de datos no cambia al repetir.
const retry = (failureCount: number, error: unknown) => {
  const { kind } = toDataError(error);
  return (kind === 'offline' || kind === 'unknown') && failureCount < 2;
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // gcTime igual a la vida de la caché persistida: si no, se descartaría antes de guardarse.
      queries: { retry, staleTime: 30_000, gcTime: CACHE_MAX_AGE },
      mutations: { retry: false },
    },
  });
}

// Caché en el teléfono (SQLite) para ver lo ya cargado sin conexión. En web no se persiste.
export const queryPersister = Platform.OS === 'web' ? undefined : createAsyncStoragePersister({
  key: CACHE_KEY,
  storage: {
    getItem: readValue,
    setItem: (key, value) => writeValue(key, value),
    removeItem: (key) => writeValue(key, null),
  },
});

// Sin red, TanStack pausa las queries y muestra la caché.
let listening = false;
export function listenToConnectivity() {
  if (listening || Platform.OS === 'web') return;
  listening = true;
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)));
}
