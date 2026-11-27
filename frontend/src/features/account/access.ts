import type { AccountStatus } from './data/account.mappers';

export type RouteAccess = 'loading' | 'status-error' | 'deletion-error' | 'deletion-pending' | 'signed-out' | AccountStatus;

// Sin sesión se puede usar la app en el dispositivo. Con sesión, el estado de la
// cuenta (y una eliminación programada) decide si falta onboarding o consentimiento antes de abrir las pantallas.
export function routeAccess(input: {
  configured: boolean; sessionReady: boolean; userId: string | null; status: AccountStatus | undefined; statusError: boolean;
  // Estado de la eliminación de cuenta confirmado con el servidor (undefined si aún no se sabe).
  deletion: 'none' | 'pending' | undefined; deletionError: boolean;
}): RouteAccess {
  if (!input.sessionReady) return 'loading';
  if (!input.userId) return 'signed-out';
  // Una eliminación programada bloquea todo, sea cual sea el estado de la cuenta; si no se pudo comprobar, no se deja pasar.
  if (input.deletion === 'pending') return 'deletion-pending';
  if (input.deletion === undefined) return input.deletionError ? 'deletion-error' : 'loading';
  if (input.status) return input.status;
  return input.statusError ? 'status-error' : 'loading';
}

// Los datos locales (caché, borrador, stores) se borran al entrar otra cuenta. Si la misma
// persona vuelve tras vencer su sesión, se conservan: el borrador puede tener una sesión sin enviar.
export const shouldPurge = (lastUserId: string | null, userId: string) => lastUserId !== null && lastUserId !== userId;
