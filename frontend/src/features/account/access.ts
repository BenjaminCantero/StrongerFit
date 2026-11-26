import type { AccountStatus } from './data/account.mappers';

export type RouteAccess = 'loading' | 'status-error' | 'signed-out' | AccountStatus;

// Sin sesión se puede usar la app en el dispositivo. Con sesión, el estado de la
// cuenta decide si falta onboarding o consentimiento antes de abrir las pantallas.
export function routeAccess(input: {
  configured: boolean; sessionReady: boolean; userId: string | null; status: AccountStatus | undefined; statusError: boolean;
}): RouteAccess {
  if (!input.sessionReady) return 'loading';
  if (!input.userId) return 'signed-out';
  if (input.status) return input.status;
  return input.statusError ? 'status-error' : 'loading';
}

// Los datos locales (caché, borrador, stores) se borran al entrar otra cuenta. Si la misma
// persona vuelve tras vencer su sesión, se conservan: el borrador puede tener una sesión sin enviar.
export const shouldPurge = (lastUserId: string | null, userId: string) => lastUserId !== null && lastUserId !== userId;
