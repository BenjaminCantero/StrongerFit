import type { AccountStatus } from './data/account.mappers';

export type RouteAccess = 'missing-config' | 'loading' | 'status-error' | 'signed-out' | AccountStatus;

// Qué grupo de rutas puede ver la persona (AU-01): Bienvenida y Cuenta sin sesión;
// onboarding o consentimiento si faltan; el resto de la app solo con cuenta lista.
export function routeAccess(input: {
  configured: boolean; sessionReady: boolean; userId: string | null; status: AccountStatus | undefined; statusError: boolean;
}): RouteAccess {
  if (!input.configured) return 'missing-config';
  if (!input.sessionReady) return 'loading';
  if (!input.userId) return 'signed-out';
  if (input.status) return input.status;
  return input.statusError ? 'status-error' : 'loading';
}

// Los datos locales (caché, borrador, stores) se borran al entrar otra cuenta. Si la misma
// persona vuelve tras vencer su sesión, se conservan: el borrador puede tener una sesión sin enviar.
export const shouldPurge = (lastUserId: string | null, userId: string) => lastUserId !== null && lastUserId !== userId;
